export const LEAF_ANCHOR = "(?! [^@])";

// Anchors a spec-file pattern to a segment boundary so `delegate.spec.ts` cannot match inside
// `undelegate.spec.ts`. Playwright compiles --grep with `new RegExp(pattern, "gi")` in Node,
// which supports lookbehind.
export const SPEC_ANCHOR = "(?<![\\w.-])";

const REGEX_LITERAL_ESCAPE = /\\([\^$.*+?()[\]{}|,/\\-])/g;
// Exact forward mirror of REGEX_LITERAL_ESCAPE — the two must stay inverses so an escaped pattern
// renders unescaped in the job summary, and so the `esc` in
// tools/actions/composites/get-failed-tests-summary/action.yml keeps ONE counterpart to mirror
// (see "Keep in sync" in ./README.md).
const REGEX_LITERAL = /[\^$.*+?()[\]{}|,/\\-]/g;

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

export function escapeLiteral(text) {
  return String(text).replace(REGEX_LITERAL, "\\$&");
}
