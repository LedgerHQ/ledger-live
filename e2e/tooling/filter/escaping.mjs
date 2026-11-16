// A literal space in a filter with no "|" is split into OR alternatives (normalizeAlternatives in
// resolve.mjs, and the run-e2e-playwright-tests composite), so generated patterns spell it `\s`.
export const ESCAPED_SPACE = "\\s";
export const LEAF_ANCHOR = `(?!${ESCAPED_SPACE}[^@])`;
// Still in the rerun patterns of failed-tests summaries written before the `\s` spelling.
const LEGACY_LEAF_ANCHOR = "(?! [^@])";

// Anchors a spec-file pattern to a segment boundary so `delegate.spec.ts` cannot match inside
// `undelegate.spec.ts`. Playwright compiles --grep with `new RegExp(pattern, "gi")` in Node,
// which supports lookbehind.
export const SPEC_ANCHOR = "(?<![\\w.-])";

const REGEX_LITERAL_ESCAPE = /\\(?:([\^$.*+?()[\]{}|,/\\-])|s)/g;
// Exact forward mirror of REGEX_LITERAL_ESCAPE (plus space -> ESCAPED_SPACE) — the two must stay
// inverses so an escaped pattern renders unescaped in the job summary, and so the `esc` in
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
  return pattern.replaceAll(LEAF_ANCHOR, "").replaceAll(LEGACY_LEAF_ANCHOR, "");
}

export function isLeafTitlePattern(part) {
  return part.endsWith(LEAF_ANCHOR);
}

export function upgradeLegacyLeafPattern(part) {
  return part.endsWith(LEGACY_LEAF_ANCHOR) ? part.replaceAll(" ", ESCAPED_SPACE) : part;
}

export function unescapeLiteral(pattern) {
  return pattern.replace(REGEX_LITERAL_ESCAPE, (_, literal) => literal ?? " ");
}

export function escapeLiteral(text) {
  return String(text).replace(REGEX_LITERAL, "\\$&").replaceAll(" ", ESCAPED_SPACE);
}
