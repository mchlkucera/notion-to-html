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
const hasImageBlocks = (blocks) =>
   blocks.filter(
      (block) => block.type == "image" && block?.image.type == "file"
   ).length > 0;

// Upload images
// Returns new aray with uploaded Images
async function uploadImages(blocks, uploadSettings) {
   const { body, pageId } = uploadSettings;

   // Filter blocks with images (with type file)
   const imageBlocks = blocks.filter(
      (block) => block.type == "image" && block?.image.type == "file"
   );

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
            if (result) console.log(`> Found ${result.resources.length} imgs`);
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

   // Image upload
   if (toBeUploadedBlocks.length > 0)
      console.log(`> UPLOADING ${toBeUploadedBlocks.length} IMAGES`);
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
      }
      return block;
   });
}

const missingImageParams = (params, body) => {
   params.uploadImages &&
      !(
         body.cloudinaryCloudName &&
         body.cloudinaryApiKey &&
         body.cloudinaryApiSecret
      );
};

const mergeBlocksWithChildren = (blocks, childBlocks) => {
   return blocks.map((block) => {
      if (block.has_children && !block[block.type].children) {
         block[block.type]["children"] = childBlocks.find(
            (x) => x.id === block.id
         ).children;
      }
      return block;
   });
};

exports.index = async (req, res) => {
   try {
      const { pageId } = req.params;
      const { body } = req;
      const { token } = body;
      const params = req.query;
      const { remoteAddress } = req.socket;

      // Log some info about the client
      console.log({ params, ip: remoteAddress, pageId });

      if (missingImageParams(params, body))
         throw {
            object: "error",
            status: 401,
            code: "cloudinary_unauthorized",
            message: `cloudinary credentials are missing. Make sure you include cloudinaryCloudName, cloudinaryApiKey and cloudinaryApiSecret in the request body.`,
         };

      const blocks = await getBlocks(token, pageId);
      const childBlocks = await Promise.all(
         blocks
            .filter((block) => block.has_children)
            .map(async (block) => ({
               id: block.id,
               children: await getBlocks(token, block.id),
            }))
      );

      // Check for image upload
      const doImageUpload =
         params.uploadImages == "true" &&
         hasImageBlocks(blocks) &&
         hasImageBlocks(blocks);

      // Upload images
      if (doImageUpload) {
         const uploadSettings = {
            pageId,
            body,
         };

         const newBlocks = await uploadImages(blocks, uploadSettings);
         const newChildBlocks = await Promise.all(
            childBlocks.map(async (block) => ({
               id: block.id,
               children: await uploadImages(block.children, uploadSettings),
            }))
         );

         const blocksWithChildren = mergeBlocksWithChildren(
            newBlocks,
            newChildBlocks
         );

         // Response
         res.render("index", {
            blocks: await getImageDimensions(blocksWithChildren),
            params,
         });
      }

      // No image upload
      else {
         const blocksWithChildren = mergeBlocksWithChildren(
            blocks,
            childBlocks
         );
         res.render("index", {
            blocks: await getImageDimensions(blocksWithChildren),
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
