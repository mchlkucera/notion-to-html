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

// Return background: bgColor or color: textColor
const getColorOrBg = (color) => {
   const hasBackground = color.includes("background");
   if (hasBackground)
      return { backgroundColor: backgroundColors[color.split("_")[0]] };
   return color !== "default" ? { color: textColors[color] } : {};
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
      const colorOrBg = getColorOrBg(color);
      const annotationStyles = {
         fontWeight: bold ? "bold" : "",
         fontStyle: italic ? "italic" : "",
         textDecoration: strikethrough
            ? "line-through"
            : underline
            ? "underline"
            : "",
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
            style={{ ...colorOrBg, ...annotationStyles }}
            className={code ? "inline-code" : undefined}
         >
            {text.link ? (
               <a href={text.link.url} target="_blank">
                  {textContent}
               </a>
            ) : (
               textContent
            )}
         </span>
      );
   });
};

let orderedListCount = 1;
const renderBlock = ({ block, params }) => {
   const webflow = params.webflow == "true";
   const pseudoNumberedList = params.pseudoNumberedList == "true";
   const { type, id } = block;
   const value = block[type];
   const colorOrBg = getColorOrBg(value.color);

   // Reset orderedListCount if this block is not numbered_list_item
   if (orderedListCount > 1 && type !== "numbered_list_item")
      orderedListCount = 1;

   switch (type) {
      case "paragraph":
         return (
            <p style={colorOrBg}>
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
      case "numbered_list_item":
         orderedListCount++;
         // render pseudo ordered list
         if (pseudoNumberedList)
            return (
               <div className="pseudo-numbered-list" style={colorOrBg}>
                  <span className="list-number">{orderedListCount - 1}.</span>
                  <span className="list-content">
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
                  </span>
               </div>
            );
         // render default unordered list
         else
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

         // Makes image full width by default
         // if caption is "center", image will be centered and caption hidden
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
            <div style={colorOrBg} className={webflow ? "pre-container" : ""}>
               <pre>
                  <code key={id}>{value.rich_text[0].plain_text}</code>
               </pre>
               <div className="code-caption">
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
                  style={{
                     width: "24px",
                     height: "24px",
                  }}
               >
                  {icon.type !== "emoji" ? (
                     <img
                        src={imgSrc}
                        alt=""
                        style={{
                           width: "24px",
                           height: "24px",
                           borderRadius: "3px",
                           objectFit: "cover",
                        }}
                     />
                  ) : (
                     icon.emoji
                  )}
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
