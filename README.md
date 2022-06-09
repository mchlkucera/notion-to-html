# Introduction

The Notion to HTML API will convert your (private) database items to HTML. You can customise the HTML output with multiple query parameters.
If you want to convert a public Notion page to HTML. Use this [API by @asnunes](https://github.com/asnunes/notion-page-to-html).

## Getting started

### Using the public API

1. Create a Notion integration at [notion.so/my-integrations](https://www.notion.so/my-integrations) and provide access to the databases you want to use.
2. To authorize each request, add a `token` parameter in the request body and set the value to the `Internal Integration Token` of your Notion integration
3. Get the HTML of any page at `https://notion-to-html.herokuapp.com/[pageId]`.

How to get the pageId? Get it with an integration or [see how get it manually](https://developers.notion.com/docs/working-with-page-content#creating-a-page-with-content:~:text=Where%20can%20I%20find%20my%20page%27s%20ID%3F) (go to "Where can I find my page's ID?").

### Running the API

-  Clone this repository
-  Run `npm install` to install dependencies
-  Run `npm run start` to start the development server on `localhost:3000`

For production deployment I recommend [Heroku](https://heroku.com/deploy?template=https://github.com/mchlkucera/notion-to-html)

### Error codes

The API uses standard HTTP error codes.

-  `200 - OK`: Everything worked out as expected
-  `401 - Unauthorized`: No valid API key provided.
-  `500 - Server error`: Something unexpected happened, the API is down

## Current limitations and supported blocks

### Limitations

Nested child blocks are supported only one level depp on **toggle**, **list** and **to_do** blocks.

```markdown
-  First level list
   -  Second level list
      -  Third level list (unsupported)
         > Second level toggle
         > Third level paragraph (unsupported)
```

## Supported blocks

-  paragraph
-  heading_1
-  heading_2
-  heading_3
-  bulleted_list_item
-  numbered_list_item: by default rendered as a bullet list, see [improved lists parameter](#improved-lists) for a workaround)
-  to_do
-  toggle
-  child_page
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
-  `callout` blocks are automatically styled with a background color or a border
-  Add [optional parameters](#optional-params) for improved styling.

# Optional params

Each param expects a boolean value and is set to `false` by default. To apply a parameter add it to the request query: `notion-to-html.herokuapp.com/pageId?param1=true&param2=true`

| Key                                            | When set to true                                      |
| ---------------------------------------------- | ----------------------------------------------------- |
| [`webflow`](#webflow-styles-optimization)      | Optimizes styling for Webflow Richtext                |
| [`uploadImages`](#upload-images-to-cloudinary) | Uploads each uploaded image to Cloudinary             |
| [`headingIds`](#heading-ids)                   | Adds ids on headings for in-page links                |
| [`headingAnchors`](#heading-anchors)           | Adds anchor links before each heading                 |
| [`darkMode`](#dark-mode)                       | Optimizes the color scheme for dark mode              |
| [`htmlTags`](#html-tags)                       | Converts annotations as HTML tags (instead of styles) |
| [`codeCopyBtn`](#code-copy-button)             | Inserts a button for copying code blocks              |

## Webflow styles optimization

`webflow` param adds classes to optimize the output for Webflow Rich Text block. See my [blog post](https://myblock.webflow.io/post/how-to-make-a-notion-to-webflow-blog#47800c5f88c24ba4bbb38b1de294dd74) for copy-paste custom Webflow styles.

Image tweaks:

-  Lazy loading
-  Class `w-richtext-figure-type-image`
-  Class `w-richtext-figure-type-fullwidth` (for images without caption `center`)
-  Images with `center` keyword in caption will set the image to centered with the classname `w-richtext-align-center`.

Other improved elements:

-  second level `<ul>` (class `ul-2nd-level`)
-  code (class `pre-container`)
-  dividers (class `divider`)
-  videos (classes `w-richtext-align-fullwidth w-richtext-figure-type-video`, default iframe styling)

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

URLs of images uploaded to Notion expire after one day. This is why each image must pe uploaded to a third party. Note: duplicate uploads are prevented.

**Image upload setup:**

1. Create a http://cloudinary.com/ account
2. Click `Start configuring` under `Configure your SDK`
3. Get the Cloud name, Api key and Api secret, and define following keys in the **request body**: `cloudinaryCloudName`, `cloudinaryApiKey`, `cloudinaryApiSecret` and set the right values.
4. Set the `uploadImages` parameter to true

## Heading ids

Adds `id` to all heading blocks. With this param turned on, you can use native Notion in-document anchors. Use the link in the form `your-page.com/article-slug#heading-id`.

## Heading anchors

Adds an anchor icon before each heading block. This parameter works only id `headingIds` is turned on as well.

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

## HTML tags

Wraps each annotated text in corresponding HTML tags. (By default, annotations get converted to inline styles e.g. `<span style="font-weight:bold">text</span>`)

| Annotation    | HTML tag   |
| ------------- | ---------- |
| bold          | `<strong>` |
| italic        | `<i>`      |
| strikethrough | `<strike>` |
| inline co de  | `<code>`   |
| underline     | `<u>`      |

## Code copy button

Inserts a button compatible with the FinSweets' [Copy to clipboard](https://www.finsweet.com/attributes/copy-to-clipboard) attribute in each code block.
If turned on, the following structure is given to code blocks:

```html
<pre>
   <code>{CODE CONTENTS}</code>
   <a href="#" className="copy-button"
      fs-copyclip-element="click"
      fs-copyclip-text="{CODE CONTENTS}"
      fs-copyclip-message="Copied!"
      fs-copyclip-duration="1000"
   >Copy</a>
</pre>
```

# Used libraries

-  [Notion blog to NextJS](https://github.com/samuelkraft/notion-blog-nextjs)
-  [Notion JS Client](https://github.com/makenotion/notion-sdk-js)
