import sanitizeHtml from "sanitize-html";

export function sanitizeMessageHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "pre", "code", "a", "h2", "h3"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (_tagName, attributes) => {
        const safe: Record<string, string> = { rel: "noopener noreferrer" };
        if (attributes.href) safe.href = attributes.href;
        if (attributes.target === "_blank") safe.target = "_blank";
        return { tagName: "a", attribs: safe };
      },
    },
  });
}
