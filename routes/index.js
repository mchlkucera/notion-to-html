const { getBlocks } = require("../lib/notion");
const cloudinary = require("cloudinary").v2;
const probe = require("probe-image-size");

exports.index = async (req, res) => {
   try {
      const {
         token,
         cloudinaryCloudName,
         cloudinaryApiKey,
         cloudinaryApiSecret,
      } = req.body;

      const { pageId } = req.params;
      const params = req.query;
      const { remoteAddress } = req.socket;
      console.log({ params, ip: remoteAddress, pageId });

      console.log({
         cloudinaryCloudName,
         cloudinaryApiKey,
         cloudinaryApiSecret,
      });

      if (
         params.uploadImages &&
         (!cloudinaryCloudName || !cloudinaryApiKey | !cloudinaryApiSecret)
      )
         throw {
            object: "error",
            status: 401,
            code: "cloudinary_unauthorized",
            message:
               "Cloudinary credentials are missing. Make sure you include cloudinaryCloudName, cloudinaryApiKey and cloudinaryApiSecret in the request body.",
         };

      const blocks = await getBlocks(token, pageId);
      const childBlocks = await Promise.all(
         blocks
            .filter((block) => block.has_children)
            .map(async (block) => {
               return {
                  id: block.id,
                  children: await getBlocks(token, block.id),
               };
            })
      );
      const blocksWithChildren = blocks.map((block) => {
         if (block.has_children && !block[block.type].children) {
            block[block.type]["children"] = childBlocks.find(
               (x) => x.id === block.id
            ).children;
         }
         return block;
      });

      console.log({ blocks, blocksWithChildren });

      // Add width and height to block.image
      const getImageDimensions = async (blocks) =>
         await Promise.all(
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

      // UPLOAD IMAGES
      // Find image blocks
      const imageBlocks = blocks.filter(
         (block) => block.type == "image" && block?.image.type == "file"
      );
      // Check settings && are there image blocks?
      if (params.uploadImages == "true" && imageBlocks.length > 0) {
         // Set up cloudinary
         cloudinary.config({
            cloud_name: cloudinaryCloudName,
            api_key: cloudinaryApiKey,
            api_secret: cloudinaryApiSecret,
         });

         // See if the images were already uploaded
         const rawFoundImages = await Promise.resolve(
            cloudinary.api.resources(
               {
                  type: "upload",
                  prefix: `notion-blog/${pageId}`,
               },
               function (err, result) {
                  if (err) return;
                  if (result.resources.length > 0)
                     console.log(`> FOUND ${result.resources.length} IMAGES`);
                  result.resources.map(({ public_id }) =>
                     console.log({ id: public_id.split("/")[2] })
                  );
               }
            )
         );
         const foundImages = rawFoundImages.resources.map(
            ({ url, public_id }) => ({
               url,
               imageId: public_id.split("/")[2],
            })
         );

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
         const updatedBlocks = blocks.map((block) => {
            if (block.type == "image" && block?.image.type == "file") {
               block.file =
                  alreadyUploadedBlocks.find((x) => x.id === block.id)?.file ||
                  uploadedBlocks.find((x) => x.id === block.id)?.file;
            }
            return block;
         });

         res.render("index", {
            blocks: await getImageDimensions(updatedBlocks),
            params,
         });
      } else
         res.render("index", {
            blocks: await getImageDimensions(blocksWithChildren),
            params,
         });
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
