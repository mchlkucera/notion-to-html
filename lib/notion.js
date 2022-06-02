const { Client } = require("@notionhq/client");
const dotenv = require("dotenv");
dotenv.config();

const getBlocks = async (token, blockId) => {
   const notion = new Client({
      auth: token,
   });
   const blocks = [];
   let cursor;
   while (true) {
      const { results, next_cursor } = await notion.blocks.children.list({
         start_cursor: cursor,
         block_id: blockId,
      });
      blocks.push(...results);
      if (!next_cursor) {
         break;
      }
      cursor = next_cursor;
   }
   return blocks;
};

module.exports = { getBlocks };
