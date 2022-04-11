const { getBlocks } = require("../lib/notion");

exports.index = async (req, res) => {
   const { pageId } = req.params;
   try {
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
      res.render("index", { blocks: blocksWithChildren, params });
   } catch (err) {
      console.log(err);
      res.status(500).send(JSON.parse(err?.body).message);
   }
};
