// Rationale and reported shapes: support/lint/README.md#suffix-importsno-platform-suffix.

import fs from "node:fs";
import path from "node:path";

const RELATIVE_SUFFIX = /\.(?:web|native)(\.[cm]?[jt]sx?)?$/;
const SUBPATH_SUFFIX = /\/(web|native)(?:\.[cm]?[jt]sx?)?$/;

// Only our own workspace packages. `styled-components/native`, `@ledgerhq/crypto-icons/native` and
// `@react-navigation/native` are third-party platform entry points, and `@support/*` test tooling
// exposes `./native` and `./web` as its documented API.
const INTERNAL_SCOPE = /^@(?:features|shared|domain)\//;

const MESSAGES = {
  relative: "Imports should not carry a .web or .native suffix, use --fix to remove it",
  module:
    "A module named web.ts or native.ts is the pre-tsconfig-split pattern. Rename it to index.ts / index.native.ts so the specifier needs no suffix. Not autofixable: dropping the segment here resolves to a different module",
  native:
    "A /native platform entry is imported only from native code: a .native file, the mobile app, or a package with no web build. See docs/adr/universal-components.md (R5)",
  web: "A /web platform entry is imported only from web code: a .web file, the desktop app, or a package with no native build. See docs/adr/universal-components.md (R5)",
};

const PLATFORM_FILE = { native: /\.native\.[^/\\]+$/, web: /\.web\.[^/\\]+$/ };
const PLATFORM_APP = {
  native: /(?:^|[/\\])apps[/\\]ledger-live-mobile[/\\]/,
  web: /(?:^|[/\\])apps[/\\]ledger-live-desktop[/\\]/,
};

const packagePlatformCache = new Map();

/**
 * The platform of the package that owns `dir`, from the tsconfigs it carries: a cross-platform
 * package has `tsconfig.web.json` and `tsconfig.native.json`, a single-platform one only its own.
 *
 * @param {string} dir
 * @returns {"native" | "web" | null}
 */
function packagePlatform(dir) {
  if (packagePlatformCache.has(dir)) return packagePlatformCache.get(dir);

  let platform = null;
  if (fs.existsSync(path.join(dir, "package.json"))) {
    const native = fs.existsSync(path.join(dir, "tsconfig.native.json"));
    const web = fs.existsSync(path.join(dir, "tsconfig.web.json"));
    if (native !== web) platform = native ? "native" : "web";
  } else {
    const parent = path.dirname(dir);
    if (parent !== dir) platform = packagePlatform(parent);
  }

  packagePlatformCache.set(dir, platform);
  return platform;
}

/**
 * @param {string | undefined} filename
 * @param {"native" | "web"} platform
 * @returns {boolean} whether the file only ever runs on `platform`
 */
function isPlatformCode(filename, platform) {
  if (typeof filename !== "string") return false;
  return (
    PLATFORM_FILE[platform].test(path.basename(filename)) ||
    PLATFORM_APP[platform].test(filename) ||
    packagePlatform(path.dirname(filename)) === platform
  );
}

/**
 * Classifies a module specifier imported from `filename`, returning null when it carries no
 * redundant platform suffix. `fixed` is null for the cases an autofix would silently repoint at
 * another module.
 *
 * @param {unknown} specifier
 * @param {string} [filename]
 * @returns {{ kind: "relative" | "module" | "native" | "web", fixed: string | null } | null}
 */
function findPlatformSuffix(specifier, filename) {
  if (typeof specifier !== "string") return null;

  if (RELATIVE_SUFFIX.test(specifier)) {
    return { kind: "relative", fixed: specifier.replace(RELATIVE_SUFFIX, "$1") };
  }

  const subpath = SUBPATH_SUFFIX.exec(specifier);
  if (!subpath) return null;

  if (specifier.startsWith(".")) return { kind: "module", fixed: null };

  // A platform entry is a package subpath, not a suffix: code of its own platform may import it.
  // Stripping it would repoint at the universal entry, which does not export the same components.
  const platform = subpath[1];
  if (INTERNAL_SCOPE.test(specifier) && !isPlatformCode(filename, platform)) {
    return { kind: platform, fixed: null };
  }

  return null;
}

// `require()`, `import()` and the jest mocking helpers, which take the specifier as an argument
// rather than on a `source` property.
const CALLEE_NAMES = new Set(["require"]);
const JEST_METHODS = new Set(["mock", "unmock", "doMock", "requireActual", "requireMock"]);

/**
 * @param {{ callee?: { type: string, name?: string, object?: { type: string, name?: string }, property?: { type: string, name?: string } } }} node
 * @returns {boolean} whether the call takes a module specifier as its first argument
 */
function isSpecifierCall(node) {
  const callee = node.callee;
  if (!callee) return false;
  if (callee.type === "Identifier") return CALLEE_NAMES.has(callee.name);
  return (
    callee.type === "MemberExpression" &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "jest" &&
    callee.property?.type === "Identifier" &&
    JEST_METHODS.has(callee.property.name)
  );
}

const noPlatformSuffixImports = {
  meta: { fixable: "code" },
  createOnce(context) {
    /** @param {{ value?: unknown } | undefined} literal */
    function report(literal) {
      const match = findPlatformSuffix(literal?.value, context.filename);
      if (!match) return;

      context.report({
        message: MESSAGES[match.kind],
        node: literal,
        ...(match.fixed === null
          ? {}
          : {
              fix(fixer) {
                return fixer.replaceText(literal, JSON.stringify(match.fixed));
              },
            }),
      });
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
      before() {},
      ImportDeclaration: checkSource,
      ExportNamedDeclaration: checkSource,
      ExportAllDeclaration: checkSource,
      ImportExpression: checkSource,
      TSImportType: checkSource,
      CallExpression: checkCall,
    };
  },
};

/**
 * The override that waives the rule for `packages`, the packages of a layer that still import with
 * a platform suffix. An entry goes in the change that cleans its package up, so the list only
 * shrinks. Package names are globs relative to the layer config that re-exports the preset.
 *
 * @param {string[]} packages
 * @returns {{ files: string[], rules: Record<string, "off"> }}
 */
function platformSuffixWaivers(packages) {
  return {
    files: packages.map(pkg => `${pkg}/**`),
    rules: { "suffix-imports/no-platform-suffix": "off" },
  };
}

export { findPlatformSuffix, platformSuffixWaivers };

export default {
  meta: {
    name: "suffix-imports",
  },
  rules: {
    "no-platform-suffix": noPlatformSuffixImports,
  },
};
