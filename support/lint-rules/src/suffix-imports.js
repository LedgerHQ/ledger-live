// Platform variants are carried by file names (`Foo.web.tsx` / `Foo.native.tsx`) and resolved by
// configuration: `moduleSuffixes` in tsc, `moduleFileExtensions` in jest, `resolve.extensions` in
// rspack, `preferNativePlatform` in Re.Pack. A suffix in the specifier itself is redundant, defeats
// tsc's cross-platform contamination check, and rots on a rename. See docs/tsconfig-in-ddd.md.

const RELATIVE_SUFFIX = /\.(?:web|native)$/;
const SUBPATH_SUFFIX = /\/(?:web|native)$/;

// Only our own workspace packages. `styled-components/native`, `@ledgerhq/crypto-icons/native` and
// `@react-navigation/native` are third-party platform entry points, and `@support/*` test tooling
// exposes `./native` and `./web` as its documented API.
const INTERNAL_SCOPE = /^@(?:features|shared|domain)\//;

const MESSAGES = {
  relative: "Imports should not carry a .web or .native suffix, use --fix to remove it",
  subpath:
    "Imports should not target a /web or /native subpath of a workspace package, use --fix to remove it",
  module:
    "A module named web.ts or native.ts is the pre-tsconfig-split pattern. Rename it to index.ts / index.native.ts so the specifier needs no suffix. Not autofixable: dropping the segment here resolves to a different module",
};

/**
 * Classifies a module specifier, returning null when it carries no redundant platform suffix.
 * `fixed` is null for the cases an autofix would silently repoint at another module.
 *
 * @param {unknown} specifier
 * @returns {{ kind: "relative" | "subpath" | "module", fixed: string | null } | null}
 */
function findPlatformSuffix(specifier) {
  if (typeof specifier !== "string") return null;

  if (RELATIVE_SUFFIX.test(specifier)) {
    return { kind: "relative", fixed: specifier.replace(RELATIVE_SUFFIX, "") };
  }

  if (INTERNAL_SCOPE.test(specifier) && SUBPATH_SUFFIX.test(specifier)) {
    return { kind: "subpath", fixed: specifier.replace(SUBPATH_SUFFIX, "") };
  }

  if (specifier.startsWith(".") && SUBPATH_SUFFIX.test(specifier)) {
    return { kind: "module", fixed: null };
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
      const match = findPlatformSuffix(literal?.value);
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
