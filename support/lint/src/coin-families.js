// Rationale and reported shapes: support/lint/README.md#coin-familiesno-coin-specific-import.

import fs from "node:fs";
import path from "node:path";

import { isSpecifierCall } from "./specifier-calls.js";

const SKILL = ".agents/skills/coin-families-contract/SKILL.md";

const MESSAGES = {
  "coin-package": `Generic code must not import a coin module or a live-signer. Reach coin code through the families contract. See ${SKILL}`,
  "live-common-family": `Generic code must not import a live-common family. Reach coin code through the families contract. See ${SKILL}`,
  "app-family": `Generic code must not import an app families folder directly. Go through the families contract. See ${SKILL}`,
  directive: `Inline disables of coin-families rules are not allowed: a violation is baselined, never silenced. See ${SKILL}`,
};

// coin-package. The package name, not a prefix capture, decides: the capture would stop at the first `-` and
// take `coin-module-framework` for a coin module.
const LEDGERHQ_PACKAGE = /^@ledgerhq\/([^/]+)/;
const COIN_PACKAGE_PREFIXES = ["coin-", "live-signer-"];
const NOT_A_COIN_MODULE = new Set([
  "coin-module-framework",
  "coin-framework",
  "coin-modules-monitoring",
  "coin-module-boilerplate",
]);
const COIN_TESTER_PREFIX = "coin-tester";

// live-common-family.
const LIVE_COMMON_FAMILY = /^@ledgerhq\/live-common\/(?:lib(?:-es)?\/)?families\/[^/]+/;

// app-family. Both apps map `~/*` to `./src/*` in their tsconfig; a bare `src/` specifier is relative to the
// app root.
const SRC_ALIAS = "~/";
const BARE_SRC = "src/";
const SOURCE_EXTENSION = /\.[cm]?[jt]sx?$/;

// What oxlint 1.93.0 honours: a comment that starts with the directive (whitespace and newlines
// allowed before it), then a list of rules, then an optional `-- explanation`. Prose that merely
// mentions a directive, or a JSDoc-style `/** ... */`, is not one.
const DIRECTIVE = /^\s*(?:oxlint|eslint)-disable(?:-next-line|-line)?(?=\s|$)([\s\S]*)$/;
const EXPLANATION = /\s--(?:\s|$)/;
const RULE_PREFIX = /coin-families\//;

/**
 * @typedef {object} Options
 * @property {string} [familiesDir] the families folder of the app, relative to its root. Without it
 *   only coin packages and live-common families are checked.
 * @property {"contract" | "forbidden"} [barrel] `contract`: the folder's entry point is the lazy
 *   contract and stays importable. `forbidden`: it is eager, so it is reported like any family.
 * @property {string[]} [allow] entries of the families folder that stay importable in `contract` mode
 */

const SCHEMA = [
  {
    type: "object",
    properties: {
      familiesDir: { type: "string" },
      barrel: { enum: ["contract", "forbidden"] },
      allow: { type: "array", items: { type: "string" } },
    },
    additionalProperties: false,
  },
];

const appRootCache = new Map();

/**
 * The app that owns `dir`: its nearest ancestor holding a package.json. `cwd` is not available to
 * a plugin's `createOnce`, so the folder is found from the file being linted.
 *
 * @param {string} dir
 * @returns {string | null}
 */
function appRoot(dir) {
  if (appRootCache.has(dir)) return appRootCache.get(dir);

  let root = null;
  if (fs.existsSync(path.join(dir, "package.json"))) root = dir;
  else {
    const parent = path.dirname(dir);
    if (parent !== dir) root = appRoot(parent);
  }

  appRootCache.set(dir, root);
  return root;
}

/**
 * @param {string} specifier
 * @returns {boolean} whether it names a coin module or a live-signer package, or one of their subpaths
 */
function isCoinPackage(specifier) {
  const name = LEDGERHQ_PACKAGE.exec(specifier)?.[1];
  if (!name) return false;
  if (!COIN_PACKAGE_PREFIXES.some(prefix => name.startsWith(prefix))) return false;
  return !NOT_A_COIN_MODULE.has(name) && !name.startsWith(COIN_TESTER_PREFIX);
}

/**
 * @param {string} specifier
 * @param {string} filename the importer
 * @param {string} root the app root of the importer
 * @returns {string | null} the absolute path the specifier points at, null for a package
 */
function resolveLocal(specifier, filename, root) {
  if (specifier.startsWith(".")) return path.resolve(path.dirname(filename), specifier);
  if (specifier.startsWith(SRC_ALIAS))
    return path.join(root, "src", specifier.slice(SRC_ALIAS.length));
  if (specifier.startsWith(BARE_SRC)) return path.join(root, specifier);
  return null;
}

/**
 * Where `specifier` lands in the families folder.
 *
 * @param {string} specifier
 * @param {string} filename
 * @param {string} root
 * @param {string} familiesDir
 * @returns {{ entry: string } | null} `entry` is the first segment below the folder, "" for its
 *   entry point; null when the specifier points outside it
 */
function familiesEntry(specifier, filename, root, familiesDir) {
  const resolved = resolveLocal(specifier, filename, root);
  if (resolved === null) return null;

  const below = path.relative(path.join(root, familiesDir), resolved);
  if (below.startsWith("..") || path.isAbsolute(below)) return null;

  const segments = below.split(path.sep).filter(Boolean);
  const entry = (segments[0] ?? "").replace(SOURCE_EXTENSION, "");
  return { entry: segments.length <= 1 && entry === "index" ? "" : entry };
}

/**
 * @param {string} filename
 * @param {string | undefined} familiesDir
 * @returns {boolean} whether the file is part of the families folder, where coin imports are the point
 */
function isInFamilies(filename, familiesDir) {
  const root = appRoot(path.dirname(filename));
  if (!root || !familiesDir) return false;
  const below = path.relative(path.join(root, familiesDir), filename);
  return !below.startsWith("..") && !path.isAbsolute(below);
}

/**
 * Classifies a module specifier imported from `filename`, returning null when generic code may
 * import it.
 *
 * @param {unknown} specifier
 * @param {string | undefined} filename
 * @param {Options} [options]
 * @returns {"coin-package" | "live-common-family" | "app-family" | null}
 */
function classifyImport(specifier, filename, options = {}) {
  if (typeof specifier !== "string" || typeof filename !== "string") return null;
  const { familiesDir, barrel = "forbidden", allow = [] } = options;

  if (isInFamilies(filename, familiesDir)) return null;
  if (isCoinPackage(specifier)) return "coin-package";
  if (LIVE_COMMON_FAMILY.test(specifier)) return "live-common-family";
  if (!familiesDir) return null;

  const root = appRoot(path.dirname(filename));
  if (!root) return null;
  const target = familiesEntry(specifier, filename, root, familiesDir);
  if (!target) return null;

  if (target.entry === "") return barrel === "contract" ? null : "app-family";
  return barrel === "contract" && allow.includes(target.entry) ? null : "app-family";
}

/**
 * The module specifier a node holds. A template literal has no `value`, but one without a
 * substitution is as fixed as a string, so its cooked text is the specifier. One with a
 * substitution is built at run time and has none to check.
 *
 * @param {{ type?: string, value?: unknown, expressions?: unknown[], quasis?: { value?: { cooked?: string | null } }[] } | undefined} node
 * @returns {unknown}
 */
function specifierOf(node) {
  if (node?.type === "TemplateLiteral") {
    return node.expressions?.length === 0 ? node.quasis?.[0]?.value?.cooked : undefined;
  }
  return node?.value;
}

/**
 * Whether a comment disables a coin-families rule. The plugin and the script next to `lint:arch`
 * both decide with this, so they cannot disagree on what a directive is.
 *
 * @param {string} commentValue the text of one whole comment, without its `//` or `/* *\/`
 * @returns {boolean}
 */
function isCoinFamiliesDisable(commentValue) {
  const directive = DIRECTIVE.exec(commentValue);
  if (!directive) return false;
  return RULE_PREFIX.test(directive[1].split(EXPLANATION)[0]);
}

const noCoinSpecificImport = {
  meta: { schema: SCHEMA },
  createOnce(context) {
    /** @type {Options} */
    let options = {};

    /** @param {{ value?: unknown } | undefined} literal */
    function report(literal) {
      const category = classifyImport(specifierOf(literal), context.filename, options);
      if (category) context.report({ message: MESSAGES[category], node: literal });
    }

    /** @param {{ source?: { value?: unknown } }} node */
    function checkSource(node) {
      report(node.source);
    }

    /** @param {Parameters<typeof isSpecifierCall>[0] & { arguments?: { value?: unknown }[] }} node */
    function checkCall(node) {
      if (isSpecifierCall(node)) report(node.arguments?.[0]);
    }

    return {
      before() {
        options = context.options?.[0] ?? {};
      },
      ImportDeclaration: checkSource,
      ExportNamedDeclaration: checkSource,
      ExportAllDeclaration: checkSource,
      ImportExpression: checkSource,
      TSImportType: checkSource,
      // `import x = require("...")`: the specifier is on `expression`, not on a `source`.
      TSExternalModuleReference(node) {
        report(node.expression);
      },
      CallExpression: checkCall,
      // A directive that names the reporting rule hides that rule's own report, so this is the
      // visible half: the script next to `lint:arch` is the one that cannot be silenced.
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (isCoinFamiliesDisable(comment.value)) {
            context.report({ message: MESSAGES.directive, node: comment });
          }
        }
      },
    };
  },
};

export { classifyImport, isCoinFamiliesDisable };

export default {
  meta: {
    name: "coin-families",
  },
  rules: {
    "no-coin-specific-import": noCoinSpecificImport,
  },
};
