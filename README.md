## Current limitations

-  child blocks only allowed 1 level deep on _toggle_ and _list_ blocks (both u)
-  Both ordered and unordered list will be converted to unordered lists

## Supported blocks

-  paragraph
-  heading_1
-  heading_2
-  heading_3
-  bulleted_list_item (searches for child pages one block deep)
-  numbered_list_item (converted to unordered list) (searches for child pages one block deep)
-  to_do
-  toggle (searches for child pages one block deep)
-  child_page (link)
-  image
-  divider
-  quote
-  code
-  file
-  callout

## Used libraries

-  [Notion blog to NextJS](https://github.com/samuelkraft/notion-blog-nextjs)
-  [Notion Client](https://github.com/samuelkraft/notion-blog-nextjs)

## How to start

1. add NOTION_TOKEN and NOTION_DATABASE_ID into `.env` file
2. run `npm run start`
3. access the app at `localhost:3000/[pageId]`

## Optional header params

-  `forWebflow`: adds classes and optimization for Webflow Richtext
   -  imgs: lazy loading, added classes
