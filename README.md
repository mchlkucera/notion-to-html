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
-  numbered_list_item (by default converts to bulleted list, see optional params for setup)
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

### Unsupported blocks

-  bookmark
-  pdf
-  table_of_contents
-  breadcrumb
-  embed
-  link_preview
-  synced_block
-  table
-  table_row
-  child_database

## Callout styling

Inline styles are used for setting text colors, backgrounds and annotations. The only place with heavy use of inline styles is the `callout` block.

```jsx
<div
   className="callout"
   style={{
      padding: "16px 16px 16px 12px",
      display: "flex",
      borderRadius: "3px",
      margin: "4px 0",
      /* + border/color */
   }}
>
   {/* Callout icon container */}
   <div
      style={{
         width: "24px",
         height: "24px",
         borderRadius: "3px",
      }}
   >
      {/* Callout img instead of emoji handling */}
      {icon.type !== "emoji" ? (
         <img
            src={imgSrc}
            alt=""
            style={{
               width: "22px",
               height: "22px",
               objectFit: "cover",
            }}
         />
      ) : (
         icon.emoji
      )}
   </div>
   <div style={{ marginLeft: "8px" }}>Callout content</div>
</div>
```

## Optional params

-  `forWebflow`: added classes and optimization for Webflow Richtext
-  `uploadImages`: uploads each image to Cloudinary
-  `pseudoNumberedList`: workaround for numbered lists
-  `headingIds`: adds ids on headings for in-page links

(Each param expects boolean value and is false by default)

### Webflow optimization

Use the `forWebflow` parameter to add Webflow styling optimization classes.

-  Images:
   -  default Webflow styles (class `w-richtext-figure-type-image`)
   -  adds lazy loading
   -  Makes images fullwidth by default. Insert `center` in the Notion image caption to make image centered (class `w-richtext-align-fullwidth`) (the API will not insert the caption)
-  Added classes on
   -  second level `<ul>` (class `ul-2nd-level`)
   -  code (class `pre-container`)
   -  toggles
   ```html
   <details>
      <summary class="toggle-summary">
         <div className="toggle-triangle">
            <span>▶</span>
         </div>
         <div className="toggle-summary-content">Toggle summary</div>
      </summary>
      <div className="details-content">Hidden toggle content</div>
   </details>
   ```
   -  dividers (class `divider`)
   -  videos

### Image upload to Cloudinary

Fetched URLs of images uploaded to default expire after one day. In order to keep the image URLs pernamently, it's required to upload all images someplace else. I choose Cloudinary for this.
Each time you have the `uploadImages` parameter set to `true`, the API will first look if the image were not already uploaded before. If it finds, it uses the old URL, if not, it uploads a new image.

#### Image upload setup

1. Create a http://cloudinary.com/ account
2. Choose configure your SDK
3. To your environment variables, add `CLOUDINARY_CLOUD_NAME` (cloud_name), `CLOUDINARY_API_KEY` (api_key), `CLOUDINARY_API_SECRET` (api_secret)
4. Add `uploadImages=true` as a query param with each request

## Numbered lists

By default, numbered lists will be converted to unordered lists. When using the parameter `pseudoNumberedList=true` the API will replace the default `<li>` for

```html
<div class="pseudo-numbered-list">
   <span className="list-number">1.</span>
   <span className="list-content">List content</span>
</div>
```

### Heading ids

Adds id for h1, h2, h3 blocks. You can find the id by going into the dev tools (F12) and finding the corresponding heading. You can then use the link in the form `link.com/article#heading-id`

## Used libraries

-  [Notion blog to NextJS](https://github.com/samuelkraft/notion-blog-nextjs)
-  [Notion JS Client](https://github.com/makenotion/notion-sdk-js)
