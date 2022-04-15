const { style } = require("jade/lib/runtime");
const React = require("react");
const { Fragment } = require("react");

const textColors = {
   default: "rgb(55, 53, 47)",
   gray: "rgb(120, 119, 116)",
   brown: "rgb(159, 107, 83)",
   orange: "rgb(217, 115, 13)",
   yellow: "rgb(203, 145, 47)",
   green: "rgb(68, 131, 97)",
   blue: "rgb(51, 126, 169)",
   purple: "rgb(144, 101, 176)",
   pink: "rgb(193, 76, 138)",
   red: "rgb(212, 76, 71)",
};
const backgroundColors = {
   default: "rgb(241, 241, 239)",
   gray: "rgb(241, 241, 239)",
   brown: "rgb(244, 238, 238)",
   orange: "rgb(251, 236, 221)",
   yellow: "rgb(251, 243, 219)",
   green: "rgb(237, 243, 236)",
   blue: "rgb(231, 243, 248)",
   purple: "rgba(244, 240, 247, 0.8)",
   pink: "rgba(249, 238, 243, 0.8)",
   red: "rgb(253, 235, 236)",
};

const Text = ({ text }) => {
   if (!text) {
      return null;
   } else if (text.length == 0) {
      return "ㅤ";
   }
   return text.map((value) => {
      // Add annotation styles
      const {
         annotations: { bold, code, color, italic, strikethrough, underline },
         text,
      } = value;
      const annotationStyles = {
         fontWeight: bold ? "bold" : "",
         fontStyle: italic ? "italic" : "",
         textDecoration: strikethrough
            ? "line-through"
            : underline
            ? "underline"
            : "",
      };
      const mergedStyles = {
         color: color !== "default" ? textColors[color] : "",
         ...annotationStyles,
      };

      // Replace newlines with <br />
      // + double "\n" prevention
      const hasNewlines = text.content && text.content.includes("\n");
      const splitNewline = hasNewlines && text.content.split("\n");
      const textContent = !hasNewlines
         ? text.content
         : splitNewline.map((line, i) => (
              <Fragment key={i}>
                 {line}
                 {splitNewline.length - 1 > i && <br />}
              </Fragment>
           ));

      return (
         <span
            style={mergedStyles}
            className={code ? "inline-code" : undefined}
         >
            {text.link ? (
               <a href={text.link.url}>{textContent}</a>
            ) : (
               textContent
            )}
         </span>
      );
   });
};

// Return background: bgColor or color: textColor
const getColorOrBg = (color) => {
   const hasBackground = color.includes("background");
   if (hasBackground)
      return { backgroundColor: backgroundColors[color.split("_")[0]] };
   return color !== "default" ? { color: textColors[color] } : {};
};

const renderBlock = ({ block, params }) => {
   const webflow = params.webflow == "true";
   const { type, id } = block;
   const value = block[type];
   const colorOrBg = value.color && getColorOrBg(value.color);

   switch (type) {
      case "paragraph":
         return (
            <p style={{ ...colorOrBg, padding: webflow ? "3px 2px" : "" }}>
               <Text text={value.rich_text} />
            </p>
         );
      case "heading_1":
         return (
            <h1 style={colorOrBg}>
               <Text text={value.rich_text} />
            </h1>
         );
      case "heading_2":
         return (
            <h2 style={colorOrBg}>
               <Text text={value.rich_text} />
            </h2>
         );
      case "heading_3":
         return (
            <h3 style={colorOrBg}>
               <Text text={value.rich_text} />
            </h3>
         );
      case "bulleted_list_item":
      case "numbered_list_item":
         return (
            <li style={colorOrBg}>
               <Text text={value.rich_text} />
               {value.children && (
                  <ul className={webflow ? "ul-2nd-level" : undefined}>
                     {value.children?.map((block) => (
                        <Fragment key={block.id}>
                           {renderBlock({ block, params })}
                        </Fragment>
                     ))}
                  </ul>
               )}
            </li>
         );
      case "to_do":
         return (
            <div style={colorOrBg}>
               <label htmlFor={id}>
                  <input
                     type="checkbox"
                     id={id}
                     defaultChecked={value.checked}
                  />{" "}
                  <Text text={value.rich_text} />
               </label>
            </div>
         );
      case "toggle":
         return (
            <details style={colorOrBg}>
               <summary className={webflow ? "toggle-summary" : undefined}>
                  {webflow ? (
                     <>
                        <div className="toggle-triangle">
                           <span>▶</span>
                        </div>
                        <div className="toggle-summary-content">
                           <Text text={value.rich_text} />
                        </div>
                     </>
                  ) : (
                     <Text text={value.rich_text} />
                  )}
               </summary>
               <div className={webflow ? "details-content" : undefined}>
                  {value.children?.map((block) => (
                     <Fragment key={block.id}>
                        {renderBlock({ block, params })}
                     </Fragment>
                  ))}
               </div>
            </details>
         );
      case "child_page":
         return <p style={colorOrBg}>{value.title}</p>;
      case "image":
         const src =
            value.type === "external" ? value.external.url : value.file.url;
         const plainCaption = value.caption ? value.caption[0]?.plain_text : "";

         // Makes image full width
         // - if "webflow" == true and caption is "fullwidth"
         // -> caption will be hidden + image will be 100% width
         const center = webflow && plainCaption == "center";

         return (
            <figure
               className={
                  center
                     ? "w-richtext-align-center w-richtext-figure-type-image"
                     : webflow
                     ? "w-richtext-align-fullwidth w-richtext-figure-type-image"
                     : undefined
               }
            >
               <div>
                  <img
                     src={src}
                     alt={plainCaption}
                     loading={webflow ? "lazy" : undefined}
                  />
               </div>
               {plainCaption && !center && (
                  <figcaption>
                     <Text text={value.caption} />
                  </figcaption>
               )}
            </figure>
         );
      case "divider":
         return <hr key={id} className={webflow ? "divider" : undefined} />;
      case "quote":
         return (
            <blockquote key={id}>{value.rich_text[0].plain_text}</blockquote>
         );
      case "code":
         return (
            <div style={{ ...colorOrBg, margin: "20px 0" }}>
               <pre
                  style={{
                     padding: "2px 4px",
                     margin: "4px 0",
                     tabSize: "2",
                     overflow: "auto",
                     borderRadius: "8px",
                     boxShadow: "0 0 8px rgba(0,4px,0,0.2)",
                  }}
               >
                  <code key={id}>{value.rich_text[0].plain_text}</code>
               </pre>
               <div
                  style={{
                     padding: "6px 2px 6px",
                  }}
               >
                  <Text text={value.caption} />
               </div>
            </div>
         );
      case "file":
         const src_file =
            value.type === "external" ? value.external.url : value.file.url;
         const splitSourceArray = src_file.split("/");
         const lastElementInArray =
            splitSourceArray[splitSourceArray.length - 1];
         const caption_file = value.caption ? value.caption[0]?.plain_text : "";
         return (
            <figure>
               <div className="file">
                  📎{" "}
                  <a href={src_file} passhref="true">
                     {lastElementInArray.split("?")[0]}
                  </a>
               </div>
               {caption_file && <figcaption>{caption_file}</figcaption>}
            </figure>
         );
      case "callout":
         const { icon } = value;
         const imgSrc =
            icon.type === "external" ? icon.external.url : icon.file?.url;

         // Callout styles
         const calloutStyle = {
            padding: "16px 16px 16px 12px",
            display: "flex",
            borderRadius: "3px",
            margin: "4px 0",
         };

         // If !background, add a border
         const border = !value.color.includes("background")
            ? `1px solid ${textColors[colorOrBg.color]}`
            : undefined;

         return (
            <div
               className="callout"
               style={{ border, ...colorOrBg, ...calloutStyle }}
            >
               <div
                  style={{ width: "24px", height: "24px", borderRadius: "3px" }}
               >
                  {icon.type !== "emoji" && (
                     <img
                        src={imgSrc}
                        alt=""
                        style={{
                           width: "22px",
                           height: "22px",
                           objectFit: "cover",
                        }}
                     />
                  )}
                  {icon.emoji}
               </div>
               <div style={{ marginLeft: "8px" }}>
                  <Text text={value.rich_text} />
                  {value.children?.map((block) => (
                     <Fragment key={block.id}>
                        {renderBlock({ block, params })}
                     </Fragment>
                  ))}
               </div>
            </div>
         );
      case "video":
         return (
            <figure
               className={
                  webflow ? "w-richtext w-richtext-align-fullwidth" : undefined
               }
            >
               <video
                  autoPlay={true}
                  muted={true}
                  controls={true}
                  style={{ width: "100%" }}
               >
                  <source src={value.file.url} type="video/mp4" />
                  Your browser does not support the video tag.
               </video>
               {value.caption && (
                  <figcaption>
                     <Text text={value.caption} />
                  </figcaption>
               )}
            </figure>
         );
      default:
         return `❌ Unsupported block (${
            type === "unsupported" ? "unsupported by Notion API" : type
         })`;
   }
};

const app = ({ blocks, params }) => {
   // Return html with converted blocks
   return (
      <article>
         {blocks.map((block) => (
            <Fragment key={block.id}>{renderBlock({ block, params })}</Fragment>
         ))}
      </article>
   );
};

module.exports = app;
