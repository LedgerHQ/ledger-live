"use strict";

// Pure rules for the package-structure check. No I/O, so every branch is unit-testable.
//
// A barrel (`index.*`) is a pure regrouping point: nothing but `export * from "./x"`, plus an
// optional default re-export. Having to sort in the export (`export { a, b } from "./x"`) proves
// the target file mixes public and private, so the private part was never moved to an `internals`
// location. Re-exporting another package turns the barrel into a proxy: two import paths for the
// same symbol, and no obvious original provider.

const path = require("node:path");
const ts = require("typescript");

/** @typedef {{ line: number, code: string, message: string, text: string, breaker?: ChainBreaker }} Violation */
/** @typedef {{ line: number, reason: string }} ChainBreak why a barrel breaks a pure chain */
/** @typedef {ChainBreak & { file: string }} ChainBreaker the barrel that breaks it */
/** @typedef {{ line: number, kind: "star" | "namespace" | "named" | "code", isDefault: boolean, specifier: string | undefined, text: string }} Statement */

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

/**
 * @param {string} source raw file contents
 * @param {string} file parses a `.tsx` or `.jsx` file with JSX, and the rest without
 * @returns {ts.SourceFile}
 */
function parse(source, file) {
  const scriptKind = /\.[jt]sx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind);
}

/**
 * Every top-level statement of a module, sorted by kind and read with the TypeScript parser alone,
 * so export-looking text in a string, a template, a pattern or JSX is never taken for a statement.
 * An export declaration is a `star`, `namespace` or `named` export; anything else is `code`.
 *
 * @param {string} source raw file contents
 * @param {string} file parses a `.tsx` or `.jsx` file with JSX, and the rest without
 * @returns {Statement[]}
 */
function statementsOf(source, file) {
  const sourceFile = parse(source, file);
  const lines = source.split("\n");
  /** @type {Statement[]} */
  const found = [];
  for (const statement of sourceFile.statements) {
    if (ts.isEmptyStatement(statement)) continue;
    const line = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)).line + 1;
    const text = lines[line - 1]?.trim() ?? "";
    if (!ts.isExportDeclaration(statement)) {
      found.push({ line, kind: "code", isDefault: false, specifier: undefined, text });
      continue;
    }
    const clause = statement.exportClause;
    found.push({
      line,
      kind: !clause ? "star" : ts.isNamespaceExport(clause) ? "namespace" : "named",
      // `export { default } from "./x"` and `export { X as default } from "./x"`.
      isDefault:
        !!clause &&
        ts.isNamedExports(clause) &&
        clause.elements.length === 1 &&
        clause.elements[0].name.text === "default",
      specifier:
        statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
          ? statement.moduleSpecifier.text
          : undefined,
      text,
    });
  }
  return found;
}

/**
 * The re-export declarations of a module: its statements that name a module to export from.
 *
 * @param {string} source raw file contents
 * @param {string} file
 * @returns {Array<Statement & { specifier: string }>}
 */
function reexportsOf(source, file) {
  return /** @type {Array<Statement & { specifier: string }>} */ (
    statementsOf(source, file).filter(({ specifier }) => specifier !== undefined)
  );
}

/**
 * The relative, non-internal `export *` specifiers of a module: the files it makes public as a
 * whole, which the check follows.
 *
 * @param {string} source raw file contents
 * @param {string} [file]
 * @returns {string[]}
 */
function starReexportTargets(source, file = "module.tsx") {
  return reexportsOf(source, file)
    .filter(({ kind, specifier }) => kind === "star" && specifier.startsWith("."))
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
 * @param {string} [file]
 * @returns {Violation[]}
 */
function checkReachedModule(source, options = {}, file = "module.tsx") {
  const violations = [];

  for (const { line, kind, isDefault, specifier, text } of reexportsOf(source, file)) {
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
    } else if (kind !== "star" && !isDefault) {
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

// What breaks a pure `export *` chain down the folder tree, worded once for the violation and the
// `nested-barrel` fix. Stricter than checkBarrel: the default re-export a barrel may hold still
// breaks a chain.
const CHAIN_BREAKS = {
  named: "has a named export or a default re-export",
  namespace: "renames with `export * as`",
  code: "holds code",
  outside: "re-exports a path outside its folder",
};

/**
 * The first statement of a barrel that breaks a pure `export *` chain, see CHAIN_BREAKS.
 *
 * @param {string} source raw file contents
 * @param {string} file parses a `.tsx` or `.jsx` file with JSX, and the rest without
 * @returns {ChainBreak | undefined}
 */
function chainBreak(source, file) {
  for (const statement of statementsOf(source, file)) {
    const reason = chainBreakReason(statement);
    if (reason) return { line: statement.line, reason };
  }
  return undefined;
}

/**
 * @param {Statement} statement
 * @returns {string | undefined}
 */
function chainBreakReason({ kind, specifier = "" }) {
  if (kind === "code") return CHAIN_BREAKS.code;
  if (kind === "namespace") return CHAIN_BREAKS.namespace;
  if (kind === "named") return CHAIN_BREAKS.named;
  const inside = specifier.startsWith("./") && !path.posix.normalize(specifier).startsWith("..");
  return inside ? undefined : CHAIN_BREAKS.outside;
}

/**
 * @param {string[]} items
 * @returns {string} "a, b or c"
 */
function listOf(items) {
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}

// The violations of checkBarrelLocation, one per code, each worded once for the violation, the
// CLI hint and the waivers.
const BARREL_LOCATION = {
  "orphan-barrel": {
    rule: "No entry reaches this barrel through `export *`",
    fix:
      "if another package uses what it groups, re-export it from the root with one " +
      '`export * from "./dir"` line; otherwise delete the barrel and import the files directly, ' +
      "or move the folder under internals/. Expose only code another package imports",
  },
  "nested-barrel": {
    rule:
      "This barrel is reached more than one `export *` level below its entry, through a chain " +
      "that is not pure `export *` down the folders",
    fix:
      'make every barrel from below the entry to this one hold only `export * from "./x"` ' +
      `lines naming paths inside its own folder (a barrel that ${listOf(Object.values(CHAIN_BREAKS))} ` +
      "breaks the chain), or re-export the files from a barrel nearer the entry",
  },
};

/**
 * Report an `index.*` that BARREL_LOCATION does not allow.
 *
 * @param {string} projectRoot posix-style, e.g. "domain/entity/contact"
 * @param {string} file posix-style path of the `index.*`, from the repo root
 * @param {number | undefined} depth barrels from its nearest entry to it, itself included: 0 for
 *   an entry, undefined when no entry reaches it
 * @param {ChainBreaker} [breaker] for a barrel more than one
 *   level deep, a barrel that breaks a chain to it; undefined when every chain to it is pure
 * @returns {Violation[]}
 */
function checkBarrelLocation(projectRoot, file, depth, breaker) {
  if (isInternalSpecifier(path.posix.dirname(file.slice(projectRoot.length + 1)))) return [];
  if (depth !== undefined && (depth <= 1 || !breaker)) return [];
  if (depth === undefined) {
    const { rule, fix } = BARREL_LOCATION["orphan-barrel"];
    const message = `${projectRoot}: ${rule}. Fix: ${fix}`;
    return [{ line: 1, code: "orphan-barrel", message, text: "" }];
  }
  const { rule, fix } = BARREL_LOCATION["nested-barrel"];
  const brokenAt = `\`${breaker.file}\` line ${breaker.line} ${breaker.reason}`;
  const message = `${projectRoot}: ${rule} (${brokenAt}). Fix: ${fix}`;
  return [{ line: 1, code: "nested-barrel", message, text: "", breaker }];
}

module.exports = {
  BARREL_LOCATION,
  CHAIN_BREAKS,
  chainBreak,
  checkBarrel,
  checkBarrelLocation,
  checkReachedModule,
  isBarrelFile,
  isInternalSpecifier,
  isInRepoSpecifier,
  starReexportTargets,
  stripComments,
};
