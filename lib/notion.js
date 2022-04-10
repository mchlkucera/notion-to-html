const { Client } = require("@notionhq/client");
const dotenv = require("dotenv");
dotenv.config();

const notion = new Client({
   auth: process.env.NOTION_TOKEN,
});

const getDatabase = async (databaseId) => {
   const response = await notion.databases.query({
      database_id: databaseId,
   });
   return response.results;
};

const getPage = async (pageId) => {
   const response = await notion.pages.retrieve({ page_id: pageId });
   return response;
};

const getBlocks = async (blockId) => {
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

module.exports = { getPage, getBlocks, getDatabase };
