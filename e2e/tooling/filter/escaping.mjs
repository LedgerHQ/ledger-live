export const LEAF_ANCHOR = "(?! [^@])";

const REGEX_LITERAL_ESCAPE = /\\([\^$.*+?()[\]{}|,/\\-])/g;

export function splitFilter(input) {
  return (String(input).match(/(?:\\.|[^|,])+/g) ?? []).map(part => part.trim()).filter(Boolean);
}

export function joinFilter(parts) {
  return [...new Set(parts)].join("|");
}

export function stripLeafAnchor(pattern) {
  return pattern.replaceAll(LEAF_ANCHOR, "");
}

export function unescapeLiteral(pattern) {
  return pattern.replace(REGEX_LITERAL_ESCAPE, "$1");
}
