const React = require("react");
const { Fragment } = require("react");
const styles = require("../styles/styles.js");

const textColor = {
   blue: "#3998DC",
   purple: "#9B5AB7",
   green: "#5DBE9F",
   orange: "#E57F31",
   pink: "#E04583",
   red: "#E74C3C",
   yellow: "#DFAB2D",
};
const backgroundColor = {
   red: "#F9DCDA",
   yellow: "#FDEBB9",
   green: "#D6FAD8",
   blue: "#D4EBFE",
   purple: "#F3DAFF",
   pink: "#F6D1ED",
};

const Text = ({ text }) => {
   if (!text) {
      return null;
   } else if (text.length == 0) {
      return "ㅤ";
   }
   return text.map((value) => {
      // Add styles
      const {
         annotations: { bold, code, color, italic, strikethrough, underline },
         text,
      } = value;
      const codeStyles = code ? styles.code : {};
      const annotationStyles = {
         textWeight: bold ? "bold" : "",
         fontStyle: italic ? "italic" : "",
         textDecoration: strikethrough
            ? "line-through"
            : underline
            ? "underline"
            : "",
      };

      // Replace newlines with <br />
      const hasNewlines = text.content.includes("\n");
      const textContent = !hasNewlines
         ? text.content
         : text.content
              .split("\n")
              .filter((x) => x.length > 0)
              .map((line, i) => (
                 <Fragment key={i}>
                    {line}
                    <br />
                 </Fragment>
              ));

      return (
         <span
            style={{
               ...codeStyles,
               ...annotationStyles,
               color: color !== "default" ? color : "",
            }}
            className={code ? "code" : undefined}
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

const renderBlock = ({ block, params }) => {
   const { webflow } = params;
   const { type, id } = block;
   const value = block[type];
   const color = value.color !== "default" ? value.color : "";

   switch (type) {
      case "paragraph":
         return (
            <p style={{ color }}>
               <Text text={value.rich_text} />
            </p>
         );
      case "heading_1":
         return (
            <h1 style={{ color }}>
               <Text text={value.rich_text} />
            </h1>
         );
      case "heading_2":
         return (
            <h2 style={{ color }}>
               <Text text={value.rich_text} />
            </h2>
         );
      case "heading_3":
         return (
            <h3 style={{ color }}>
               <Text text={value.rich_text} />
            </h3>
         );
      case "bulleted_list_item":
      case "numbered_list_item":
         return (
            <li style={{ color }}>
               <Text text={value.rich_text} />
               {value.children && (
                  <ul style={styles.ulCircle}>
                     {value.children?.map((block) => (
                        <Fragment key={block.id}>{renderBlock(block)}</Fragment>
                     ))}
                  </ul>
               )}
            </li>
         );
      case "to_do":
         return (
            <div style={{ color }}>
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
            <details style={{ color }}>
               <summary>
                  <Text text={value.rich_text} />
               </summary>
               {value.children?.map((block) => (
                  <Fragment key={block.id}>{renderBlock(block)}</Fragment>
               ))}
            </details>
         );
      case "child_page":
         return <p style={{ color }}>{value.title}</p>;
      case "image":
         const src =
            value.type === "external" ? value.external.url : value.file.url;
         const caption = value.caption ? value.caption[0]?.plain_text : "";
         return (
            <figure
               className={
                  webflow
                     ? "w-richtext-align-center w-richtext-figure-type-image"
                     : undefined
               }
            >
               <div>
                  <img
                     src={src}
                     alt={caption}
                     loading={webflow ? "lazy" : undefined}
                  />
               </div>
               {caption && <figcaption>{caption}</figcaption>}
            </figure>
         );
      case "divider":
         return <hr key={id} />;
      case "quote":
         return (
            <blockquote key={id}>{value.rich_text[0].plain_text}</blockquote>
         );
      case "code":
         return (
            <div style={{ color, margin: "20px 0" }}>
               <pre
                  style={{
                     padding: "2px 4px",
                     margin: "4px 0",
                     lineHeight: "2.3",
                     overflow: "auto",
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
         const hasBackground = color.includes("background");
         const calloutStyle = {
            padding: "16px 16px 16px 12px",
            display: "flex",
            borderRadius: "3px",
            margin: "4px 0",
         };
         const style = hasBackground
            ? { background: backgroundColor[color.split("_")[0]] }
            : { color, border: `1px solid ${textColor[color]}` };

         return (
            <div className="callout" style={{ ...style, ...calloutStyle }}>
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
               </div>
            </div>
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
