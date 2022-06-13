const { getBlocks } = require("../lib/notion");
const cloudinary = require("cloudinary").v2;
const probe = require("probe-image-size");

// Add width and height to block.image
// Returns array with image width and height
async function getImageDimensions(blocks) {
   return await Promise.all(
      blocks.map(async (block) => {
         if (block.type !== "image") return block;

         // Declare variables
         const { image } = block;
         const isTypeExternal = image.type == "external";
         const { url } = isTypeExternal ? image.external : image.file;

         // Get image dimensions
         const { width, height } = await probe(url);
         image.width = width;
         image.height = height;
         return block;
      })
   );
}

// Check for image blocks
// Returns BOOL
function hasImageBlocks(blocks) {
   return (
      blocks.filter(
         (block) => block.type == "image" && block?.image.type == "file"
      ).length > 0
   );
}

// Upload images
// Returns new aray with uploaded Images
async function uploadImages(blocks, uploadSettings) {
   const { body, pageId } = uploadSettings;

   // Filter blocks with images (with type file)
   const imageBlocks = blocks.filter(
      (block) => block.type == "image" && block?.image.type == "file"
   );
   if (imageBlocks.length == 0) return blocks;

   // Configure Cloudinary
   cloudinary.config({
      cloud_name: body.cloudinaryCloudName,
      api_key: body.cloudinaryApiKey,
      api_secret: body.cloudinaryApiSecret,
   });

   // Prevent duplicate upload
   const rawFoundImages = await Promise.resolve(
      cloudinary.api.resources(
         {
            type: "upload",
            prefix: `notion-blog/${pageId}`,
         },
         function (err, result) {
            if (err) return;
         }
      )
   );
   const foundImages = rawFoundImages.resources.map(({ url, public_id }) => ({
      url,
      imageId: public_id.split("/")[2],
   }));

   const alreadyUploadedBlocks = [],
      toBeUploadedBlocks = [];
   // Checks which images are already uploaded
   // New images are stored in "toBeUploadedBlocks"
   imageBlocks.map((block) => {
      const imageId = block.image.file.url.split("/")[4];
      const result = foundImages.find(
         (foundImage) => foundImage.imageId == imageId
      );
      if (result) {
         block.image.file.url = result.url;
         alreadyUploadedBlocks.push(block);
      } else toBeUploadedBlocks.push(block);
   });

   // Log results
   console.log({
      operation: "CLOUDINARY UPLOAD",
      total_found: foundImages.length,
      image_blocks: imageBlocks.length,
      matched: alreadyUploadedBlocks.length,
      uploading: toBeUploadedBlocks.length,
   });

   // Image upload
   const uploadedBlocks = await Promise.all(
      toBeUploadedBlocks.map(async (block) => {
         const public_id = block.image.file.url.split("/")[4];
         const response = await cloudinary.uploader.upload(
            block.image.file.url,
            { folder: `notion-blog/${pageId}`, public_id },
            (err, result) => {
               if (err) return;
               console.log({
                  message: "successfully uploaded",
                  url: result.url,
               });
            }
         );
         block.image.file.url = response.url;
         return block;
      })
   );

   // Merges all blocks into one array
   return blocks.map((block) => {
      if (block.type == "image" && block?.image.type == "file") {
         block.file =
            alreadyUploadedBlocks.find((x) => x.id === block.id)?.file ||
            uploadedBlocks.find((x) => x.id === block.id)?.file;
         return block;
      }
      return block;
   });
}

function missingImageParams(params, body) {
   params.uploadImages &&
      !(
         body.cloudinaryCloudName &&
         body.cloudinaryApiKey &&
         body.cloudinaryApiSecret
      );
}

function transformLists(blocks) {
   let openList = null;
   const array = [];
   const customList = ({ type, id, items }) => ({
      listChildren: items,
      type: "custom_list",
      listType: type,
      id,
   });

   blocks.forEach((block) => {
      const isListBlock =
         block.type === "bulleted_list_item" ||
         block.type === "numbered_list_item";
      const listTypeMatch = openList?.type == block.type;
      const openListItem = { type: block.type, items: [block], id: block.id };

      // Create a list
      if (isListBlock && !openList) return (openList = openListItem);

      // Add an item to list
      if (isListBlock && listTypeMatch) return openList.items.push(block);

      // Close the list
      if (openList && (!isListBlock || !listTypeMatch)) {
         array.push(customList(openList)); // Insert
         openList = isListBlock && !listTypeMatch ? openListItem : null; // Initialize a new list or Reset
      }

      // Don't push <li> into the array
      if (isListBlock) return;

      // Push item to list
      array.push(block);
   });
   if (openList) array.push(customList(openList));

   return array;
}

// Merges given block arrays + transforms list blocks
async function mergeAndEditBlocks(blocks, blocksWithChildren) {
   const mergedBlocks = await Promise.all(
      blocks.map(async (block) => {
         if (block.has_children && !block[block.type].children) {
            const children = blocksWithChildren.find(
               (x) => x.id === block.id
            ).children;

            await getImageDimensions(children);
            block[block.type]["children"] = transformLists(children);
         }
         return block;
      })
   );
   await getImageDimensions(mergedBlocks);
   return transformLists(mergedBlocks);
}

exports.index = async (req, res) => {
   try {
      const pageId = req.params.pageId.replace("-", "");
      const { body } = req;
      const { token } = body;
      const params = req.query;
      const { remoteAddress } = req.socket;

      // Log some info about the client
      console.log({ ip: remoteAddress, pageId });

      if (missingImageParams(params, body))
         throw {
            object: "error",
            status: 401,
            code: "cloudinary_unauthorized",
            message: `cloudinary credentials are missing. Make sure you include cloudinaryCloudName, cloudinaryApiKey and cloudinaryApiSecret in the request body.`,
         };

      // Get all blocks
      const blocks = await getBlocks(token, pageId);
      // Fetch child blocks
      const blocksWithChildren = await Promise.all(
         blocks
            .filter((block) => block.has_children)
            .map(async (block) => ({
               id: block.id,
               children: await getBlocks(token, block.id),
            }))
      );

      // Check for image upload
      const doImageUpload =
         params.uploadImages == "true" && hasImageBlocks(blocks);

      // Upload images
      if (doImageUpload) {
         const uploadParams = {
            pageId,
            body,
         };
         const mergedBlocks = await mergeAndEditBlocks(
            await uploadImages(blocks, uploadParams),
            await Promise.all(
               blocksWithChildren.map(async (block) => ({
                  id: block.id,
                  children: await uploadImages(block.children, uploadParams),
               }))
            )
         );

         // Response
         res.render("index", {
            blocks: mergedBlocks,
            params,
         });
      }

      // No image upload
      else {
         const mergedBlocks = await mergeAndEditBlocks(
            blocks,
            blocksWithChildren
         );
         res.render("index", {
            blocks: mergedBlocks,
            params,
         });
      }
   } catch (err) {
      console.log(err);
      // Cloudinary error
      if (err.error) {
         const status = err.error.http_code || 500;
         const body = {
            object: "error",
            code:
               status === 401 ? "cloudinary_unauthorized" : "cloudinary_error",
            status,
            message: err.error.message,
         };
         return res.status(status).send(body);
      }
      const body = err.body ? JSON.parse(err?.body) : err;
      const status = err.status || 500;
      res.status(status).send(body);
   }
};
