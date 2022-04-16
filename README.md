## Usage

1. Add `NOTION_TOKEN` and `NOTION_DATABASE_ID` in `.env` file
2. Run `npm run start`
3. Access the app at `localhost:3000/[pageId]`

## Current limitations

-  Child blocks are only supported on **toggle** and **list** and **to_do** blocks. Child blocks only available one level deep.

## Supported blocks

-  paragraph
-  heading_1
-  heading_2
-  heading_3
-  bulleted_list_item
-  numbered_list_item (by default rendered as bullet list item, see optional params for setup)
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

## Optional params

Each param expects boolean value

-  `forWebflow`: added classes and optimization for Webflow Richtext
-  `uploadImages`: uploads each image to Cloudinary
-  `pseudoNumberedList`: workaround for numbered lists

### Webflow optimization

-  Images:
   -  default Webflow styles (class `w-richtext-figure-type-image`)
   -  adds lazy loading
   -  Makes images fullwidth by default. Insert `center` in the Notion image caption to make image centered (class `w-richtext-align-fullwidth`) (the API will not insert the caption)
-  Adds padding on paragraphs
-  Added classes on: second level `<ul>`, toggles, dividers, video blocks

### Image upload to Cloudinary

Fetched URLs of images uploaded to default expire after one day. In order to keep the image URLs pernamently, it's required to upload all images someplace else. I choose Cloudinary for this.
Each time you have the `uploadImages` parameter set to `true`, the API will first look if the image were not already uploaded before. If it was already uploaded, it will use the old URL.

#### Image upload setup

1. Create an account @ http://cloudinary.com/
2. Choose configure your SDK
3. Add `CLOUDINARY_CLOUD_NAME` (cloud_name), `CLOUDINARY_API_KEY` (api_key), `CLOUDINARY_API_SECRET` (api_secret) to your environment variables
4. Add `uploadImages=true` as a query param with each request

## Numbered lists

By default, numbered lists will be converted to unordered lists. When using the parameter `pseudoNumberedList=true` the API will replace the default <li> for

```html
<div class="pseudo-numbered-list">
   <span className="list-number">1.</span>
   <span className="list-content">List content</span>
</div>
```

## Used libraries

-  [Notion blog to NextJS](https://github.com/samuelkraft/notion-blog-nextjs)
-  [Notion JS Client](https://github.com/makenotion/notion-sdk-js)
