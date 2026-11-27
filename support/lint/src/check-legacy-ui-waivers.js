// Fails on a stale entry of the legacy-ui waivers, so the list only shrinks.
// Rationale: support/lint/README.md#legacy-ui.

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { globToRegExp, isLegacyModule, repoPath } from "./legacy-ui.js";
import { FILE_WAIVERS, FOLDER_WAIVERS } from "./legacy-ui-waivers.js";
import { isSpecifierCall } from "./specifier-calls.js";

const WAIVERS_FILE = "support/lint/src/legacy-ui-waivers.js";
const RULE = "legacy-ui/no-legacy-import";
const RULE_PREFIX = "legacy-ui/";
const SUPPRESSIONS_FILE = "oxlint-suppressions.json";
const SKIPPED_FOLDERS = new Set(["node_modules", ".git"]);

/** What the check fails on, by problem kind: each builds the line after `path: `. */
export const PROBLEMS = {
  unsorted: () => "out of order, keep the file waivers sorted",
  emptyFolderGlob: () => "the folder waiver matches no file, delete its entry",
  outsideApps: () => "not in a checked app",
  missingFile: () => "the file does not exist, delete its entry",
  coveredByFolder: () => "a folder waiver already covers it, delete its entry",
  noLegacyImport: () => "no longer imports a legacy UI module, delete its entry",
  /** @param {string} suppressionsFile */
  suppressed: suppressionsFile =>
    `${suppressionsFile} suppresses a legacy-ui rule, remove it and use Lumen`,
  inlineDisable: () => "an inline disable silences a legacy-ui rule, remove it and use Lumen",
};

const SOURCE = /\.[cm]?[jt]sx?$/;
// Comment-shaped spans of the raw text, not parsed comments: a string spelling one is rare enough.
const COMMENT = /\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
const DISABLE_DIRECTIVE = /^(?:\/\/|\/\*)\s*(?:eslint|oxlint)-disable(?:-next-line|-line)?\b/;

const require = createRequire(import.meta.url);
/** @type {typeof import("typescript")} */
const ts = require("typescript");

/**
 * @typedef {object} CheckInput
 * @property {string} repoRoot the folder the waiver keys are relative to
 * @property {Record<string, string>} fileWaivers
 * @property {Record<string, string>} folderWaivers
 * @property {Record<string, string[]>} apps each checked app's posix path from the repo root, with its legacy
 *   modules
 */

/**
 * @param {string} file an absolute path
 * @returns {string[]} the specifiers of the nodes `no-legacy-import` checks: import and `export ... from`
 *   declarations, `import()`, `import("...")` types, `import x = require()` and the specifier calls
 */
function importSpecifiers(file) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest);
  const specifiers = [];
  /** @param {import("typescript").Node} node */
  function visit(node) {
    const specifier = specifierOf(node);
    if (specifier && ts.isStringLiteral(specifier)) specifiers.push(specifier.text);
    ts.forEachChild(node, visit);
  }
  visit(source);
  return specifiers;
}

/**
 * @param {import("typescript").Node} node
 * @returns {import("typescript").Node | undefined} the specifier node, when `node` takes one
 */
function specifierOf(node) {
  if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return node.moduleSpecifier;
  if (ts.isExternalModuleReference(node)) return node.expression;
  if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
    return node.argument.literal;
  }
  if (ts.isCallExpression(node) && isSpecifierCall(estreeCallee(node))) return node.arguments[0];
  return undefined;
}

/**
 * @param {import("typescript").CallExpression} call
 * @returns {Parameters<typeof isSpecifierCall>[0]} the call's callee in the ESTree shape `isSpecifierCall` reads,
 *   with `import()` read as a `require()`
 */
function estreeCallee(call) {
  const callee = call.expression;
  if (callee.kind === ts.SyntaxKind.ImportKeyword) {
    return { callee: { type: "Identifier", name: "require" } };
  }
  if (ts.isIdentifier(callee)) return { callee: { type: "Identifier", name: callee.text } };
  if (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression) &&
    ts.isIdentifier(callee.name)
  ) {
    return {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: callee.expression.text },
        property: { type: "Identifier", name: callee.name.text },
      },
    };
  }
  return { callee: undefined };
}

/**
 * @param {string} root an absolute folder
 * @param {string} glob a posix glob from `root`
 * @returns {boolean} whether the glob matches at least one file
 */
function globMatchesAFile(root, glob) {
  const segments = glob.split("/");
  const firstWildcard = segments.findIndex(segment => /[*?]/.test(segment));
  if (firstWildcard === -1)
    return fs.statSync(path.join(root, glob), { throwIfNoEntry: false })?.isFile() ?? false;
  const regExp = globToRegExp(glob);
  const stack = [path.join(root, ...segments.slice(0, firstWildcard))];
  while (stack.length > 0) {
    const dir = /** @type {string} */ (stack.pop());
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !SKIPPED_FOLDERS.has(entry.name)) stack.push(full);
      else if (entry.isFile() && regExp.test(repoPath(root, full))) return true;
    }
  }
  return false;
}

/**
 * @param {CheckInput} input
 * @returns {string[]} one line per problem, `path: what`
 */
export function findProblems({ repoRoot, fileWaivers, folderWaivers, apps }) {
  const problems = [];
  const files = Object.keys(fileWaivers);
  const firstUnsorted = files.findIndex((file, index) => index > 0 && file < files[index - 1]);
  if (firstUnsorted !== -1) {
    problems.push(`${files[firstUnsorted]}: ${PROBLEMS.unsorted()}`);
  }

  for (const glob of Object.keys(folderWaivers)) {
    if (!globMatchesAFile(repoRoot, glob)) {
      problems.push(`${glob}: ${PROBLEMS.emptyFolderGlob()}`);
    }
  }

  for (const file of files) {
    const app = Object.keys(apps).find(dir => file.startsWith(`${dir}/`));
    const full = path.join(repoRoot, file);
    if (app === undefined) {
      problems.push(`${file}: ${PROBLEMS.outsideApps()}`);
    } else if (!fs.existsSync(full)) {
      problems.push(`${file}: ${PROBLEMS.missingFile()}`);
    } else if (Object.keys(folderWaivers).some(glob => globToRegExp(glob).test(file))) {
      problems.push(`${file}: ${PROBLEMS.coveredByFolder()}`);
    } else if (!importSpecifiers(full).some(s => isLegacyModule(s, full, apps[app]))) {
      problems.push(`${file}: ${PROBLEMS.noLegacyImport()}`);
    }
  }
  return [
    ...problems,
    ...suppressedFiles(repoRoot, Object.keys(apps)),
    ...inlineDisables(repoRoot, Object.keys(apps)),
  ];
}

/**
 * @param {string} dir an absolute folder
 * @returns {Generator<string>} the source files below `dir`, outside `node_modules` and dot folders
 */
function* sourceFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIPPED_FOLDERS.has(entry.name) || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(full);
    else if (entry.isFile() && SOURCE.test(entry.name)) yield full;
  }
}

/**
 * An inline disable would let a file outside the waivers import a legacy module.
 *
 * @param {string} repoRoot
 * @param {string[]} appDirs
 * @returns {string[]} one line per inline disable of a legacy-ui rule, `path:line: what`
 */
function inlineDisables(repoRoot, appDirs) {
  const problems = [];
  for (const appDir of appDirs) {
    const root = path.join(repoRoot, appDir);
    if (!fs.existsSync(root)) continue;
    for (const file of sourceFiles(root)) {
      const text = fs.readFileSync(file, "utf8");
      if (!text.includes("legacy-ui/")) continue;
      for (const match of text.matchAll(COMMENT)) {
        if (!DISABLE_DIRECTIVE.test(match[0]) || !match[0].includes("legacy-ui/")) continue;
        const line = text.slice(0, match.index).split("\n").length;
        problems.push(`${repoPath(repoRoot, file)}:${line}: ${PROBLEMS.inlineDisable()}`);
      }
    }
  }
  return problems;
}

/**
 * The waivers replace oxlint's baseline for this plugin: `oxlint --suppress-all` must not hide a new import.
 *
 * @param {string} repoRoot
 * @param {string[]} appDirs
 * @returns {string[]} one line per file whose suppressions hold a legacy-ui rule
 */
function suppressedFiles(repoRoot, appDirs) {
  const problems = [];
  for (const appDir of appDirs) {
    const file = path.join(repoRoot, appDir, SUPPRESSIONS_FILE);
    if (!fs.existsSync(file)) continue;
    const suppressions = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const [suppressed, rules] of Object.entries(suppressions)) {
      if (Object.keys(rules).some(rule => rule.startsWith(RULE_PREFIX))) {
        problems.push(
          `${appDir}/${suppressed}: ${PROBLEMS.suppressed(`${appDir}/${SUPPRESSIONS_FILE}`)}`,
        );
      }
    }
  }
  return problems;
}

/**
 * @param {string} repoRoot
 * @param {string} appDir a posix path from the repo root
 * @returns {Promise<string[]>} the legacy modules the app's oxlint config passes to the rule
 */
async function appModules(repoRoot, appDir) {
  const configFile = path.join(repoRoot, appDir, "oxlint.config.mts");
  const { default: config } = await import(pathToFileURL(configFile).href);
  const modules = config.rules?.[RULE]?.[1]?.modules;
  if (!Array.isArray(modules)) throw new Error(`${configFile} does not turn ${RULE} on`);
  return modules;
}

/** @param {string[]} appDirs posix paths from the current folder, the repo root */
async function main(appDirs) {
  const repoRoot = process.cwd();
  /** @type {Record<string, string[]>} */
  const apps = {};
  for (const appDir of appDirs) apps[appDir] = await appModules(repoRoot, appDir);

  const problems = findProblems({
    repoRoot,
    fileWaivers: FILE_WAIVERS,
    folderWaivers: FOLDER_WAIVERS,
    apps,
  });
  if (problems.length === 0) return 0;

  console.error(
    `Stale legacy-ui waivers in ${WAIVERS_FILE}. See support/lint/README.md#legacy-ui\n\n` +
      problems.join("\n"),
  );
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
