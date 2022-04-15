const { getBlocks } = require("../lib/notion");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();

exports.index = async (req, res) => {
   try {
      const { pageId } = req.params;
      const params = req.query;
      console.log({ params });
      const blocks = await getBlocks(pageId);
      const childBlocks = await Promise.all(
         blocks
            .filter((block) => block.has_children)
            .map(async (block) => {
               return {
                  id: block.id,
                  children: await getBlocks(block.id),
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

      // Upload images
      const imageBlocks = blocks.filter(
         (block) => block.type == "image" && block?.image.type == "file"
      );
      if (params.uploadImages == "true" && imageBlocks.length > 0) {
         cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
         });
         const updatedImageBlocks = await Promise.all(
            imageBlocks.map(async (block) => {
               const response = await cloudinary.uploader.upload(
                  block.image.file.url,
                  { folder: "notion-blog" },
                  (error, result) => {
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
         const updatedBlocks = blocks.map((block) => {
            if (block.type == "image" && block?.image.type == "file") {
               block.file = updatedImageBlocks.find(
                  (x) => x.id === block.id
               ).file;
            }
            return block;
         });
         res.render("index", { blocks: updatedBlocks, params });
      } else res.render("index", { blocks: blocksWithChildren, params });
   } catch (err) {
      console.log(err);
      res.status(500).send(JSON.parse(err?.body).message);
   }
};
