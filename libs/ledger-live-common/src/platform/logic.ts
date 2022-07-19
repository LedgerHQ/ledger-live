export function translateContent(content: any, locale = "en"): string {
  if (!content || typeof content !== "object") return content;
  return content[locale] || content.en;
}
