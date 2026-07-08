export const LEAF_ANCHOR = "(?! [^@])";

const REGEX_LITERAL_ESCAPE = /\\([\^$.*+?()[\]{}|,/\\-])/g;

const LEAF_ANCHOR_MATCHER = new RegExp(LEAF_ANCHOR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");

export function splitFilter(input) {
  return (String(input).match(/(?:\\.|[^|,])+/g) ?? []).map(part => part.trim()).filter(Boolean);
}

export function joinFilter(parts) {
  return [...new Set(parts)].join("|");
}

export function stripLeafAnchor(pattern) {
  return pattern.replace(LEAF_ANCHOR_MATCHER, "");
}

export function unescapeLiteral(pattern) {
  return pattern.replace(REGEX_LITERAL_ESCAPE, "$1");
}
