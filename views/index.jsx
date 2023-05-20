const React = require("react");
const { Fragment } = require("react");

const textColors = {
   dark: {
      default: "rgba(255, 255, 255, 0.81)",
      gray: "rgb(155, 155, 155)",
      brown: "rgb(186, 133, 111)",
      orange: "rgb(199, 125, 72)",
      yellow: "rgb(202, 152, 73)",
      green: "rgb(82, 158, 114)",
      blue: "rgb(94, 135, 201)",
      purple: "rgb(157, 104, 211)",
      pink: "rgb(209, 87, 150)",
      red: "rgb(223, 84, 82)",
   },
   light: {
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
   },
};
const backgroundColors = {
   dark: {
      default: "rgb(25, 25, 25)",
      gray: "rgb(47, 47, 47)",
      brown: "rgb(74, 50, 40)",
      orange: "rgb(92, 59, 35)",
      yellow: "rgb(86, 67, 40)",
      green: "rgb(36, 61, 48)",
      blue: "rgb(20, 58, 78)",
      purple: "rgb(60, 45, 73)",
      pink: "rgb(78, 44, 60)",
      red: "rgb(82, 46, 42)",
   },
   light: {
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
   },
};

// Renders strings
const Text = ({ text, getColorOrBg, htmlTags }) => {
   if (!text) return null;
   else if (text.length == 0) return "ㅤ";
   return text.map((block) => {
      // Add annotation styles
      const {
         annotations: { bold, code, color, italic, strikethrough, underline },
         type,
         plain_text,
      } = block;

      const value = block[type];
      const colorOrBg = getColorOrBg(color);
      const annotationStyles = {
         fontWeight: bold ? "600" : "",
         fontStyle: italic ? "italic" : "",
         textDecoration: strikethrough
            ? "line-through"
            : underline
            ? "underline"
            : "",
      };
      const attributes = {
         style: { ...colorOrBg, ...annotationStyles },
         className: code ? "inline-code" : undefined,
      };

      switch (type) {
         case "mention":
            if (value.type == "date") {
               const { start, end } = value.date;
               return (
                  <span {...attributes}>
                     {start && end ? plain_text : `@${start}`}
                  </span>
               );
            }
            return (
               <span {...attributes}>
                  {plain_text.includes("@") ? plain_text : `@${plain_text}`}
               </span>
            );
         case "text":
            const { content, link } = value;
            // Replace newlines with <br />
            // + double "\n" prevention
            const hasNewlines = content && content.includes("\n");
            const splitNewline = hasNewlines && content.split("\n");
            const textContent = !hasNewlines
               ? content
               : splitNewline.map((line, i) => (
                    <Fragment key={i}>
                       {line}
                       {splitNewline.length - 1 > i && <br />}
                    </Fragment>
                 ));

            // Modify in-page link
            // For in-page links keep only the part after the pound sign
            const isInlineLink = link && link.url[0] == "/";
            const updatedLink = !link
               ? undefined
               : isInlineLink
               ? "#" + link.url.split("#")[1] // modify inline link
               : link.url; // insert regular link

            const linkProps = link && {
               href: updatedLink,
               target: isInlineLink ? undefined : "_blank",
            };

            if (!htmlTags)
               return (
                  <span {...attributes}>
                     {link ? <a {...linkProps}>{textContent}</a> : textContent}
                  </span>
               );

            // Annotations, ranked by descending priority
            const annotationTags = [
               color !== "default" && "color",
               bold && "strong",
               italic && "i",
               underline && "u",
               strikethrough && "strike",
               code && "code",
            ].filter((x) => x);

            const colorStyle =
               color === "default" ? undefined : { style: colorOrBg };
            const wrapContentWithAnnotations = (content) => {
               const contentFn = () => <>{content}</>;
               const all = [...annotationTags, contentFn];
               const create = (i) => {
                  const C = all[i];
                  if (!all[i]) return null;
                  if (C === "color")
                     return <span {...colorStyle}>{create(i + 1)}</span>;
                  if (typeof C === "string")
                     return React.createElement(all[i], null, create(i + 1));
                  return <C>{create(i + 1)}</C>;
               };
               return create(0);
            };
            return (
               <>
                  {link ? (
                     <a {...linkProps}>
                        {wrapContentWithAnnotations(textContent)}
                     </a>
                  ) : (
                     wrapContentWithAnnotations(textContent)
                  )}
               </>
            );

         default:
            return "❌ Unsupported text block";
      }
   });
};

const renderBlock = ({ block, params, level = 0 }) => {
   // Param settings
   const webflow = params.webflow == "true";
   const headingIds = params.headingIds == "true";
   const headingAnchors = params.headingAnchors == "true";
   const darkMode = params.darkMode == "true";
   const htmlTags = params.htmlTags == "true";
   const copyCodeBtn = params.copyCodeBtn == "true";
   const wrapImages = params.wrapImages == "true";
   const ignoreErrors = params.ignoreErrors == "true";

   // Return `{background: bgColor}` or `{color: textColor}`
   const getColorOrBg = (color) => {
      const mode = darkMode ? "dark" : "light";
      const hasBackground = color.includes("background");
      if (hasBackground)
         return {
            backgroundColor: backgroundColors[mode][color.split("_")[0]],
         };
      return color !== "default" ? { color: textColors[mode][color] } : {};
   };

   const { type, id } = block;
   const value = block[type];
   const colorOrBg = value?.color && getColorOrBg(value.color);

   const headingId = id.replace(/-/g, "");
   // Handle in-page heading links, heading anchors
   const headingProps = type.includes("heading")
      ? {
           style: colorOrBg,
           id: headingIds || headingAnchors ? headingId : undefined,
        }
      : undefined;
   const linkSymbol = (
      <svg
         className="anchor-link"
         viewBox="0 0 16 16"
         color="#c9d1d9"
         version="1.1"
         width="16"
         height="16"
         ariaHidden="true"
      >
         <path
            fillRule="evenodd"
            d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"
         ></path>
      </svg>
   );
   const headingAnchor = headingAnchors ? (
      <a href={`#${headingId}`} className="heading-anchor" aria-hidden="true">
         {linkSymbol}
      </a>
   ) : undefined;
   const textProps = {
      getColorOrBg,
      htmlTags,
      text: value?.rich_text,
   };
   const captionProps = {
      getColorOrBg,
      htmlTags,
      text: value?.caption,
   };

   switch (type) {
      case "paragraph":
         return (
            <p style={colorOrBg}>
               <Text {...textProps} />
            </p>
         );
      case "heading_1":
         return (
            <h1 {...headingProps}>
               {headingAnchor}
               <Text {...textProps} />
            </h1>
         );
      case "heading_2":
         return (
            <h2 {...headingProps}>
               {headingAnchor}
               <Text {...textProps} />
            </h2>
         );
      case "heading_3":
         return (
            <h3 {...headingProps}>
               {headingAnchor}
               <Text {...textProps} />
            </h3>
         );
      case "custom_list":
         return React.createElement(
            block.listType === "bulleted_list_item" ? "ul" : "ol",
            { key: block.id },
            block.listChildren.map((block) => (
               <Fragment key={block.id}>
                  {renderBlock({ block, params })}
               </Fragment>
            ))
         );
      case "bulleted_list_item":
      case "numbered_list_item":
         return (
            <li style={colorOrBg}>
               <Text {...textProps} />
               {value.children && (
                  <div className="level-2">
                     {value.children?.map((block) => (
                        <Fragment key={block.id}>
                           {renderBlock({ block, params })}
                        </Fragment>
                     ))}
                  </div>
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
                  <Text {...textProps} />
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
                           <Text {...textProps} />
                        </div>
                     </>
                  ) : (
                     <Text {...textProps} />
                  )}
               </summary>
               <div className={webflow ? "details-content" : undefined}>
                  {value.children?.map((block) => (
                     <Fragment key={block.id}>
                        {renderBlock({ block, params, level: 2 })}
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
         const dimensions = (value.height / value.width) * 100;
         const imgWrapper = {
            className: "imgWrapper",
            style: dimensions
               ? {
                    paddingBottom: `${dimensions}%`,
                 }
               : {},
         };
         const image = (
            <img
               src={src}
               className="img"
               alt={plainCaption}
               loading={webflow ? "lazy" : undefined}
            />
         );
         return (
            <figure
               className={
                  level > 0 // Classes if image is nested
                     ? "level-2"
                     : center // Centered if caption is "centered" && webflow param is on
                     ? "w-richtext-align-center w-richtext-figure-type-image"
                     : webflow // Webflow classes if webflow param is on
                     ? "w-richtext-align-fullwidth w-richtext-figure-type-image"
                     : undefined
               }
               style={wrapImages ? { maxWidth: value.width } : {}}
            >
               {wrapImages ? <div {...imgWrapper}>{image}</div> : image}
               {plainCaption && !center && (
                  <figcaption>
                     <Text {...captionProps} />
                  </figcaption>
               )}
            </figure>
         );
      case "divider":
         return <hr key={id} className={webflow ? "divider" : undefined} />;
      case "quote":
         return (
            <blockquote key={id} style={colorOrBg}>
               {value.rich_text[0].plain_text}
            </blockquote>
         );
      case "code":
         return (
            <div style={colorOrBg} className={webflow ? "pre-container" : ""}>
               <pre>
                  <code key={id}>{value.rich_text[0].plain_text}</code>
                  {copyCodeBtn && (
                     <a
                        href="#"
                        className="copy-button"
                        fs-copyclip-element="click"
                        fs-copyclip-text={value.rich_text[0].plain_text}
                        fs-copyclip-message="Copied!"
                        fs-copyclip-duration="1000"
                     >
                        Copy
                     </a>
                  )}
               </pre>
               {value.caption[0]?.plain_text && (
                  <div className="code-caption">
                     <Text {...captionProps} />
                  </div>
               )}
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

         // If !background, add a border
         const border = !value.color.includes("background")
            ? `1px solid ${textColors[colorOrBg.color]}`
            : undefined;

         return (
            <div className="callout" style={{ border, ...colorOrBg }}>
               <div className="callout-icon">
                  {icon.type !== "emoji" ? (
                     <img src={imgSrc} alt="" className="callout-icon-image" />
                  ) : (
                     icon.emoji
                  )}
               </div>
               <div className="callout-content">
                  <Text {...textProps} />
                  {value.children?.map((block) => (
                     <Fragment key={block.id}>
                        {renderBlock({ block, params })}
                     </Fragment>
                  ))}
               </div>
            </div>
         );
      case "video":
         if (ignoreErrors && value.type == "file") return "";
         else if (value.type == "file")
            return "❌ Uploaded videos are not supported";

         const { url } = value.external;
         const end = url.lastIndexOf("&");

         const parseVimeoUrl = (url) => {
            var vimeoRegex =
               /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
            var parsed = url.match(vimeoRegex);
            return "https://player.vimeo.com/video/" + parsed[1];
         };
         const parseYoutubeUrl = (url) => {
            let videoId;
            if (url.includes("youtu.be"))
               videoId = url.substring(
                  url.indexOf("e/") + 2,
                  end > 0 ? end : url.length
               );
            else
               videoId = url.substring(
                  url.indexOf("v=") + 2,
                  end > 0 ? end : url.length
               );
            return `https://www.youtube.com/embed/${videoId}?feature=oembed`;
         };
         const videoUrl = url.includes("vimeo")
            ? parseVimeoUrl(url)
            : parseYoutubeUrl(url);

         const videoFigureAttributes = webflow && {
            style: { paddingBottom: "56.206088992974244%" },
            className:
               "w-richtext-align-fullwidth w-richtext-figure-type-video",
         };

         return (
            <figure {...videoFigureAttributes}>
               <iframe
                  src={videoUrl}
                  loading="lazy"
                  frameborder="0"
                  sandbox="allow-scripts allow-popups allow-top-navigation-by-user-activation allow-forms allow-same-origin"
                  allowFullScreen="true"
               ></iframe>
               {value.caption && (
                  <figcaption>
                     <Text {...captionProps} />
                  </figcaption>
               )}
            </figure>
         );
      case "embed":
         return <iframe src={value.url} loading="lazy" frameBorder="0" />;
      default:
         if (ignoreErrors) return;
         return `❌ Unsupported block (${
            type === "unsupported" ? "unsupported by Notion API" : type
         })`;
   }
};

const app = ({ blocks, params }) => (
   <>
      {blocks.map((block) => (
         <Fragment key={block.id}>{renderBlock({ block, params })}</Fragment>
      ))}
   </>
);

module.exports = app;
