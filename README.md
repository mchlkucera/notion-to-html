## Current limitations

-  Child blocks are only supported on **toggle** and **list** and **to_do** blocks. Child blocks only available one level deep.
-  Ordered list will be converted to unordered list

## Supported blocks

-  paragraph
-  heading_1
-  heading_2
-  heading_3
-  bulleted_list_item
-  numbered_list_item (is converted to unordered list)
-  to_do
-  toggle
-  child_page (link)
-  image
-  divider
-  quote
-  code
-  file
-  callout
-  video

## Used libraries

-  [Notion blog to NextJS](https://github.com/samuelkraft/notion-blog-nextjs)
-  [Notion Client](https://github.com/samuelkraft/notion-blog-nextjs)

## How to start

1. add NOTION_TOKEN and NOTION_DATABASE_ID into `.env` file
2. run `npm run start`
3. access the app at `localhost:3000/[pageId]`

## Optional header params

-  `forWebflow`: adds classes and optimization for Webflow Richtext (expects boolean values)
   -  imgs: lazy loading, added classes
