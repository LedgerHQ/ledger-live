// Platform variants are carried by file names (`Foo.web.tsx` / `Foo.native.tsx`) and resolved by
// configuration: `moduleSuffixes` in tsc, `moduleFileExtensions` in jest, `resolve.extensions` in
// rspack, `preferNativePlatform` in Re.Pack. A suffix in the specifier itself is redundant, defeats
// tsc's cross-platform contamination check, and rots on a rename. See docs/tsconfig.md.

import fs from "node:fs";
import path from "node:path";

const RELATIVE_SUFFIX = /\.(?:web|native)$/;
const SUBPATH_SUFFIX = /\/(web|native)$/;

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
    return { kind: "relative", fixed: specifier.replace(RELATIVE_SUFFIX, "") };
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

    function checkSource(node) {
      report(node.source);
    }

    function checkCall(node) {
      if (isSpecifierCall(node)) report(node.arguments?.[0]);
    }

    return {
      before() {},
      ImportDeclaration: checkSource,
      ExportNamedDeclaration: checkSource,
      ExportAllDeclaration: checkSource,
      ImportExpression: checkSource,
      CallExpression: checkCall,
    };
  },
};

export { findPlatformSuffix };

export default {
  meta: {
    name: "suffix-imports",
  },
  rules: {
    "no-platform-suffix": noPlatformSuffixImports,
  },
};
