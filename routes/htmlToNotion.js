const {markdownToBlocks} = require('@tryfabric/martian');
const TurndownService = require('turndown');

function getBlocksFromHtml(html) {
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(html);
    return markdownToBlocks(markdown);
}

exports.index = async (req, res) => {
    try {
        res.status(200).send(getBlocksFromHtml(req.query.text));
    }
    catch (error) {
      console.log(err);
      const body = err.body ? JSON.parse(err?.body) : err;
      const status = err.status || 500;
      res.status(status).send(body);
    }
};
