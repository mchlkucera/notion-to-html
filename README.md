# Introduction

The Notion to HTML API will convert your (private) database items to HTML. You can optimise the HTML output using a few query parameters.
If you want to convert a public Notion page to HTML. Use this [API by asnunes](https://github.com/asnunes/notion-page-to-html).

## Getting started

### Using the public API

1. Create a Notion integration at [notion.so/my-integrations](https://www.notion.so/my-integrations) and make sure you provide access to the databases you want to access.
2. To authorize your page, add a `token` parameter in the request body and set the value to the `Internal Integration Token` of your Notion integration
3. Get the HTML of any page at `https://notion-to-html.herokuapp.com/[pageId]`.

Not sure how to get the pageId? Get it through an See how to get the [pageId manually](https://developers.notion.com/docs/working-with-page-content#creating-a-page-with-content).

### Running the API

-  Clone this repository
-  Run `npm i` to get the required modules
-  Run `npm run start` to start the development server on `localhost:3000`

For deployment I recommend Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/mchlkucera/notion-to-html)

### Error codes

The API uses standard HTTP error codes.

-  `200 - OK`: Everything worked out as expected
-  `401 - Unauthorized`: No valid API key provided.
-  `500 - Server error`: Something unexpected happened, the API is down

## Current limitations and supported blocks

### Limitations

-  Nested child blocks are only supported on **toggle** and **list** and **to_do** blocks. These nested child blocks are available only one level deep.

## Supported blocks

-  paragraph
-  heading_1
-  heading_2
-  heading_3
-  bulleted_list_item
-  numbered_list_item (by default rendered as a bullet list, see [improved lists parameter](#improved-lists) for workaround)
-  to_do (converted to input type="checkbox")
-  toggle
-  child_page (converted to a link)
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

## Styling

-  Inline styles are used for setting text color, backgrounds, annotations.
-  `callout` are automatically styled with a background color or a border
-  See [optionalParams](#optional-params) for improved styling.

# Optional params

To improve the HTMl output, you can use the following query parameters. Click the link to each for more information. To apply a parameter add it to the request query: `notion-to-html.herokuapp.com/pageId?param1=true&param2=true`

Each param expects a boolean value and `false` by default.

| Key                                            | When set to true                          |
| ---------------------------------------------- | ----------------------------------------- |
| [`forWebflow`](#webflow-styles-optimization)   | Optimizes styling for Webflow Richtext    |
| [`uploadImages`](#upload-images-to-cloudinary) | Uploads each uploaded image to Cloudinary |
| [`improvedLists`]()                            | Workaround for numbered lists             |
| [`headingIds`](#heading-ids)                   | Adds ids on headings for in-page links    |
| [`headingAnchors`](#heading-anchors)           | Adds anchor links before each heading     |
| [`darkMode`](#dark-mode)                       | Optimizes the color scheme for dark mode  |

## Webflow styles optimization

Use the `forWebflow` parameter to add Webflow styling optimization classes. See my [blog post](https://myblock.webflow.io/post/how-to-make-a-notion-to-webflow-blog#47800c5f88c24ba4bbb38b1de294dd74) for copy-paste custom Webflow styles.

Images:

-  Added default Webflow styles (class `w-richtext-figure-type-image`)
-  Added lazy loading
-  Images with the keyword `center` in a caption, will be centered and smaller (they have the `w-richtext-align-fullwidth` class added). The caption `center` will stay hidden

Other improved elements:

-  second level `<ul>` (added class `ul-2nd-level`)
-  code (class `pre-container`)
-  dividers (class `divider`)
-  videos

Toggles are changed to:

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

## Upload images (to Cloudinary)

By default, URLs of images that are uploaded to Notion expire after one day. This is why we need to upload each image to a third party.
Note: the API prevents duplicate uploads (to save bandwidth).

**Image upload setup:**

1. Create a http://cloudinary.com/ account
2. Get the Cloud name, Api key and Api secret, and define following keys in the request body: `cloudinaryCloudName`, `cloudinaryApiKey`, `cloudinaryApiSecret` and set the to the right values.
3. Add the `uploadImages` parameter

## Improved lists

By default, numbered lists will be converted to unordered lists. When using the parameter `improvedLists=true` the API will replace the default `<li>`

```html
<div class="list numbered-list">
   <span className="list-item-marker">1.</span>
   <span className="list-item-content">List content</span>
</div>
```

## Heading ids

Adds id for h1, h2, h3 blocks. You can then use the link in the form `link.com/article#heading-id`. With this parameter turned on, native Notion in-document links will work.

## Heading anchors

Adds an anchor icon before each h1, h2 and h3 blocks. Adds an `<a>` element inside h1, h2, h3 blocks. This parameter works only id `headingIds` is turned on as well.

The anchor element will have the following form:

```html
<h1>
   <a href="#heading-id" class="heading-anchor">
      <svg><!-- Anchor icon --></svg>
   </a>
   <span>Example heading</span>
</h2>
```

**Recommended anchor icon styling:**

```css
.heading-anchor {
   padding-right: 4px;
   margin-left: -20px;
   visibility: hidden;
   line-height: 1;
   border: none !important;
}
h1:hover .heading-anchor,
h2:hover .heading-anchor,
h3:hover .heading-anchor {
   visibility: visible;
}
```

## Dark mode

Optimizes the background and text colors for dark mode.

# Used libraries

-  [Notion blog to NextJS](https://github.com/samuelkraft/notion-blog-nextjs)
-  [Notion JS Client](https://github.com/makenotion/notion-sdk-js)
