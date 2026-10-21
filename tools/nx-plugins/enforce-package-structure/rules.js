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

// After one of these, a `/` starts a regular expression rather than a division. `<` is left
// out: `</` closes a JSX element.
const REGEX_PRECEDER =
  /(?:[(,=:[!&|?{};+\-*%>~^]|(?:^|[^\w$.])(?:return|typeof|case|do|else|in|of|new|delete|void|throw|yield|await|instanceof))$/;

/**
 * True when a `/` following `before` opens a regular expression literal.
 *
 * @param {string} before the code preceding the `/`
 * @returns {boolean}
 */
function startsRegex(before) {
  const preceding = before.slice(-200).trimEnd();
  return preceding === "" || REGEX_PRECEDER.test(preceding);
}

/**
 * Offset just past the regular expression literal starting at `start`, its flags aside. A `/`
 * inside a character class does not end it, and neither literal can span lines.
 *
 * @param {string} code
 * @param {number} start
 * @returns {number}
 */
function skipRegex(code, start) {
  let inClass = false;
  let i = start + 1;
  while (i < code.length && code[i] !== "\n") {
    const char = code[i];
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === "[") inClass = true;
    else if (char === "]") inClass = false;
    else if (char === "/" && !inClass) return i + 1;
    i += 1;
  }
  return i;
}

/**
 * Blank out comments while preserving line count and column offsets, so violation line numbers
 * stay accurate. String and regular expression literals are walked over so a `//` inside a
 * specifier, or a `/*` inside a pattern, is not mistaken for a comment.
 *
 * @param {string} source
 * @returns {string}
 */
function stripComments(source) {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const two = source.slice(i, i + 2);
    if (source[i] === "/" && two !== "//" && two !== "/*" && startsRegex(out)) {
      const end = skipRegex(source, i);
      out += source.slice(i, end);
      i = end;
      continue;
    }
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
      // A quote string cannot span lines, so a stray apostrophe in JSX text stops at its line.
      while (i < source.length && source[i] !== quote && (quote === "`" || source[i] !== "\n")) {
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

// A re-export statement, matched where the scanner below finds a top-level `export`. Group 1 is
// the export clause (`*`, `* as ns`, `{ … }`), group 3 the specifier.
const REEXPORT_STATEMENT =
  /export\s+(?:type\s+)?(\*(?:\s+as\s+[A-Za-z_$][\w$]*)?|\{[^}]*\})\s+from\s+(['"])([^'"]+)\2/y;

/**
 * Offset just past the quote string starting at `start`. A quote string cannot span lines.
 *
 * @param {string} code
 * @param {number} start
 * @returns {number}
 */
function skipString(code, start) {
  let i = start + 1;
  while (i < code.length && code[i] !== code[start] && code[i] !== "\n") {
    i += code[i] === "\\" ? 2 : 1;
  }
  return i + 1;
}

/**
 * Offset just past the `{ … }` block starting at `start`, literals included.
 *
 * @param {string} code
 * @param {number} start
 * @returns {number}
 */
function skipBlock(code, start) {
  let depth = 0;
  let i = start;
  while (i < code.length) {
    const char = code[i];
    if (char === '"' || char === "'") {
      i = skipString(code, i);
      continue;
    }
    if (char === "`") {
      i = skipTemplate(code, i);
      continue;
    }
    if (char === "/" && startsRegex(code.slice(Math.max(0, i - 200), i))) {
      i = skipRegex(code, i);
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  return i;
}

/**
 * Offset just past the template literal starting at `start`, `${ … }` substitutions included.
 *
 * @param {string} code
 * @param {number} start
 * @returns {number}
 */
function skipTemplate(code, start) {
  let i = start + 1;
  while (i < code.length && code[i] !== "`") {
    if (code[i] === "\\") i += 2;
    else if (code[i] === "$" && code[i + 1] === "{") i = skipBlock(code, i + 1);
    else i += 1;
  }
  return i + 1;
}

/**
 * Every top-level re-export statement of a module. The scan skips literal contents (strings,
 * templates, regular expressions) and nested blocks, so export-looking text in a literal is
 * ignored, while an indented statement or a second one on the same line is found.
 *
 * @param {string} source raw file contents
 * @returns {Array<{ line: number, statement: string, clause: string, specifier: string, text: string }>}
 */
function reexportsOf(source) {
  const code = stripComments(source);
  const lines = source.split("\n");
  const found = [];
  let depth = 0;
  let i = 0;
  while (i < code.length) {
    const char = code[i];
    // Formatted code starts every top-level statement in column 0. Resync there, so a misread
    // literal (a JSX text, an unusual pattern) cannot hide the statements below it.
    if ((i === 0 || code[i - 1] === "\n") && !/[\s)\]}]/.test(char)) depth = 0;
    if (char === '"' || char === "'") {
      i = skipString(code, i);
      continue;
    }
    if (char === "`") {
      i = skipTemplate(code, i);
      continue;
    }
    if (char === "/" && startsRegex(code.slice(Math.max(0, i - 200), i))) {
      i = skipRegex(code, i);
      continue;
    }
    if (char === "{" || char === "(" || char === "[") depth += 1;
    else if (char === "}" || char === ")" || char === "]") depth -= 1;
    else if (depth <= 0 && char === "e" && !/[\w$.]/.test(code[i - 1] ?? "")) {
      REEXPORT_STATEMENT.lastIndex = i;
      const match = REEXPORT_STATEMENT.exec(code);
      if (match) {
        const line = code.slice(0, i).split("\n").length;
        found.push({
          line,
          statement: match[0],
          clause: match[1],
          specifier: match[3],
          text: lines[line - 1]?.trim() ?? "",
        });
        i += match[0].length;
        continue;
      }
    }
    i += 1;
  }
  return found;
}

/**
 * The relative, non-internal `export *` specifiers of a module: the files it makes public as a
 * whole, which the check follows.
 *
 * @param {string} source raw file contents
 * @returns {string[]}
 */
function starReexportTargets(source) {
  return reexportsOf(source)
    .filter(({ clause, specifier }) => clause === "*" && specifier.startsWith("."))
    .map(({ specifier }) => specifier)
    .filter(specifier => !isInternalSpecifier(specifier));
}

/**
 * Report the re-exports of a module reached through a barrel's `export *` or named as a package
 * entry point. Its declarations are its own business, but its re-exports are public API: they
 * follow the barrel rules, so moving a named re-export or a proxy out of `index.*` hides nothing.
 *
 * @param {string} source raw file contents
 * @param {{ allowNonRelative?: boolean }} [options]
 * @returns {Violation[]}
 */
function checkReachedModule(source, options = {}) {
  const violations = [];

  for (const { line, statement, clause, specifier, text } of reexportsOf(source)) {
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
    } else if (clause !== "*" && !DEFAULT_REEXPORT.test(statement)) {
      violations.push({
        line,
        code: "hidden-barrel",
        message:
          "this module is public API, so it re-exports like a barrel: `export * from` and an optional default re-export only",
        text,
      });
    }
  }

  return violations;
}

module.exports = {
  checkBarrel,
  checkReachedModule,
  isBarrelFile,
  isInternalSpecifier,
  isInRepoSpecifier,
  starReexportTargets,
  stripComments,
};
