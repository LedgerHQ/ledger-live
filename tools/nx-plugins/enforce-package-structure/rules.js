"use strict";

// Pure rules for the package-structure check. No I/O, so every branch is unit-testable.
//
// A barrel (`index.*`) is a pure regrouping point: nothing but `export * from "./x"`, plus an
// optional default re-export. Having to sort in the export (`export { a, b } from "./x"`) proves
// the target file mixes public and private, so the private part was never moved to an `internals`
// location. Re-exporting another package turns the barrel into a proxy: two import paths for the
// same symbol, and no obvious original provider.

/** @typedef {{ line: number, code: string, message: string, text: string }} Violation */

// `index.ts`, and the platform variants beside it: `index.native.ts`, `index.web.tsx`, …
const BARREL_BASENAME = /^index(?:\.[A-Za-z0-9-]+)*\.[cm]?[jt]sx?$/;
const TEST_BASENAME = /\.(test|spec)\.[cm]?[jt]sx?$/;
const SOURCE_EXTENSION = /\.[cm]?[jt]sx?$/;

// `export * from "./x"` and `export type * from "./x"`. Deliberately does not match
// `export * as ns from "./x"` — namespacing is a form of sorting.
const STAR_REEXPORT = /^export\s+(?:type\s+)?\*\s+from\s+(['"])([^'"]+)\1\s*;?/;

// `export { default } from "./x"` and `export { X as default } from "./x"`.
const DEFAULT_REEXPORT =
  /^export\s+\{\s*(?:default|[A-Za-z_$][\w$]*\s+as\s+default)\s*,?\s*\}\s+from\s+(['"])([^'"]+)\1\s*;?/;

const IN_REPO_SCOPES = [
  "@shared/",
  "@domain/",
  "@features/",
  "@support/",
  "@devtools/",
  "@ledgerhq/",
];

/**
 * True for a file that must be a barrel: named `index.*`, excluding tests.
 *
 * @param {string} filePath posix-style path
 * @returns {boolean}
 */
function isBarrelFile(filePath) {
  const basename = filePath.split("/").pop() ?? "";
  if (TEST_BASENAME.test(basename)) return false;
  return BARREL_BASENAME.test(basename);
}

/**
 * True when a specifier points at a private location. Three recognised forms, at any depth:
 * the `internals/` directory, the `internals.ts` file, and the `<name>.internals.ts` companion.
 *
 * @param {string} specifier
 * @returns {boolean}
 */
function isInternalSpecifier(specifier) {
  const segments = specifier.replace(SOURCE_EXTENSION, "").split("/");
  if (segments.includes("internals")) return true;
  const last = segments[segments.length - 1] ?? "";
  return last.endsWith(".internals");
}

/**
 * True when a specifier names a workspace package rather than a relative file.
 *
 * @param {string} specifier
 * @returns {boolean}
 */
function isInRepoSpecifier(specifier) {
  return IN_REPO_SCOPES.some(scope => specifier.startsWith(scope));
}

/**
 * Blank out comments while preserving line count and column offsets, so violation line numbers
 * stay accurate. String literals are walked over so a `//` inside a specifier is not mistaken
 * for a comment.
 *
 * @param {string} source
 * @returns {string}
 */
function stripComments(source) {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const two = source.slice(i, i + 2);
    if (two === "//") {
      while (i < source.length && source[i] !== "\n") {
        out += " ";
        i += 1;
      }
      continue;
    }
    if (two === "/*") {
      while (i < source.length && source.slice(i, i + 2) !== "*/") {
        out += source[i] === "\n" ? "\n" : " ";
        i += 1;
      }
      out += "  ";
      i += 2;
      continue;
    }
    const char = source[i];
    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      out += char;
      i += 1;
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\") {
          out += source.slice(i, i + 2);
          i += 2;
          continue;
        }
        out += source[i];
        i += 1;
      }
      out += source[i] ?? "";
      i += 1;
      continue;
    }
    out += char;
    i += 1;
  }
  return out;
}

/**
 * Offset just past the end of the statement starting at `start`. Brackets are tracked so a
 * multi-line `export { … } from "./x";` counts as one statement rather than one per line, and
 * quotes are walked over so a `;` inside a specifier does not end it early.
 *
 * @param {string} code comment-stripped source
 * @param {number} start
 * @returns {number}
 */
function endOfStatement(code, start) {
  let depth = 0;
  let i = start;
  while (i < code.length) {
    const char = code[i];
    if (char === '"' || char === "'" || char === "`") {
      i += 1;
      while (i < code.length && code[i] !== char) {
        i += code[i] === "\\" ? 2 : 1;
      }
      i += 1;
      continue;
    }
    if (char === "{" || char === "(" || char === "[") depth += 1;
    else if (char === "}" || char === ")" || char === "]") depth -= 1;
    else if (depth <= 0 && char === ";") return i + 1;
    else if (depth <= 0 && char === "\n") return i + 1;
    i += 1;
  }
  return code.length;
}

/**
 * Report every statement in a barrel that is not an allowed re-export, plus every allowed
 * re-export that points somewhere it must not.
 *
 * @param {string} source raw file contents
 * @param {{ allowNonRelative?: boolean }} [options]
 * @returns {Violation[]}
 */
function checkBarrel(source, options = {}) {
  const code = stripComments(source);
  const violations = [];
  let cursor = 0;

  const lineAt = offset => code.slice(0, offset).split("\n").length;

  while (cursor < code.length) {
    const whitespace = /^\s+/.exec(code.slice(cursor));
    if (whitespace) {
      cursor += whitespace[0].length;
      continue;
    }

    const rest = code.slice(cursor);
    const match = STAR_REEXPORT.exec(rest) ?? DEFAULT_REEXPORT.exec(rest);

    if (!match) {
      violations.push({
        line: lineAt(cursor),
        code: "not-a-barrel",
        message:
          'a barrel may only contain `export * from "./x"` and an optional default re-export',
        text: source.split("\n")[lineAt(cursor) - 1]?.trim() ?? "",
      });
      // Consume the whole statement so one bad statement yields exactly one violation.
      cursor = endOfStatement(code, cursor);
      continue;
    }

    const specifier = match[2];
    const line = lineAt(cursor);
    const text = source.split("\n")[line - 1]?.trim() ?? "";

    if (isInternalSpecifier(specifier)) {
      violations.push({
        line,
        code: "internals-reexport",
        message: `\`${specifier}\` is a private location; internals must stay out of the public API`,
        text,
      });
    } else if (!specifier.startsWith(".") && !options.allowNonRelative) {
      const inRepo = isInRepoSpecifier(specifier);
      violations.push({
        line,
        code: inRepo ? "cross-package-reexport" : "external-reexport",
        message: inRepo
          ? `re-exporting \`${specifier}\` makes this package a proxy; consumers must import the original provider`
          : `re-exporting the third-party \`${specifier}\` makes this package a proxy`,
        text,
      });
    }

    cursor += match[0].length;
  }

  return violations;
}

module.exports = {
  checkBarrel,
  isBarrelFile,
  isInternalSpecifier,
  isInRepoSpecifier,
  stripComments,
};
