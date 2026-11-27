// Fails on an inline disable of a coin-families rule. The plugin reports such a comment too, but a
// directive that covers the whole file silences that report with the rule's own, so this check runs
// outside oxlint. Rationale: support/lint/README.md#coin-familiesno-coin-specific-import.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { isCoinFamiliesDisable } from "./coin-families.js";

// Loaded only for a file that may hold a directive, so the rest of the tree is read, not parsed.
const require = createRequire(import.meta.url);
/** @type {typeof import("typescript")} */
let ts;

const SOURCE = /\.[cm]?[jt]sx?$/;
const SKIPPED_DIRECTORY = new Set(["node_modules", ".git"]);

/**
 * A cheap superset of a file that holds a directive: the directive word and the rule prefix both
 * have to appear in its text, wherever they sit.
 *
 * @param {string} text
 * @returns {boolean}
 */
function mayHoldDirective(text) {
  return text.includes("disable") && text.includes("coin-families/");
}

/**
 * @param {string} comment a whole comment, delimiters included
 * @returns {string} its text without them, as the plugin sees it
 */
function commentValue(comment) {
  return comment.startsWith("//") ? comment.slice(2) : comment.slice(2, -2);
}

/**
 * @param {string} dir
 * @returns {Generator<string>} the source files below `dir`
 */
function* sourceFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIPPED_DIRECTORY.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(full);
    else if (SOURCE.test(entry.name)) yield full;
  }
}

/**
 * The comments in `trivia`, the text between two tokens, which holds nothing but whitespace and
 * comments, so it needs no context to be read.
 *
 * @param {string} trivia
 * @param {number} offset where `trivia` starts in the file
 * @returns {Generator<{ pos: number, end: number }>}
 */
function* triviaComments(trivia, offset) {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    /* skipTrivia */ false,
    ts.LanguageVariant.Standard,
    trivia,
  );
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (
      token === ts.SyntaxKind.SingleLineCommentTrivia ||
      token === ts.SyntaxKind.MultiLineCommentTrivia
    ) {
      yield { pos: offset + scanner.getTokenStart(), end: offset + scanner.getTokenEnd() };
    }
  }
}

/**
 * The comments of a parsed file, each whole, so one that spans several lines is one comment and a
 * string, a template or JSX text is none. A comment sits in the trivia before some token (the
 * end-of-file token included), so each token's trivia is read on its own. TypeScript's own
 * leading and trailing comment ranges are not used: they split a comment on the same line as
 * code from the one on the next line. JSX text is skipped: it can start with `//` without being
 * a comment.
 *
 * @param {import("typescript").SourceFile} sourceFile
 * @returns {Generator<{ pos: number, end: number }>}
 */
function* commentRanges(sourceFile) {
  /** @param {import("typescript").Node} node */
  function* visit(node) {
    const children = node.getChildren(sourceFile);
    if (children.length > 0) {
      for (const child of children) yield* visit(child);
      return;
    }
    if (node.kind === ts.SyntaxKind.JsxText) return;

    const from = node.getFullStart();
    const to = node.getStart(sourceFile);
    if (to > from) yield* triviaComments(sourceFile.text.slice(from, to), from);
  }

  yield* visit(sourceFile);
}

/**
 * @param {string} dir
 * @returns {string[]} `file:line` of each inline disable of a coin-families rule below `dir`, the
 *   line being where its comment starts
 */
export function findDisables(dir) {
  const found = [];
  for (const file of sourceFiles(dir)) {
    const text = fs.readFileSync(file, "utf8");
    if (!mayHoldDirective(text)) continue;

    ts ??= require("typescript");
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest);
    for (const range of commentRanges(sourceFile)) {
      if (!isCoinFamiliesDisable(commentValue(text.slice(range.pos, range.end)))) continue;
      found.push(`${file}:${sourceFile.getLineAndCharacterOfPosition(range.pos).line + 1}`);
    }
  }
  return found;
}

function main(dirs) {
  const found = dirs.flatMap(findDisables);
  if (found.length === 0) return 0;

  console.error(
    "Inline disables of coin-families rules are not allowed: a violation is baselined, never silenced.\n" +
      "See .agents/skills/coin-families-contract/SKILL.md\n\n" +
      found.join("\n"),
  );
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
