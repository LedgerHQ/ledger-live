import { fileURLToPath } from "node:url";
import { defineConfig } from "oxlint";

// The root of the lint preset chain. Every `@support/lint-*` preset extends this object, so the
// baseline is written once and a layer preset only records where it differs.
//
// Most of what follows is *demotions*. oxlint's `correctness` category is an error by default and
// contains the React Compiler rules, which this codebase treats as advice rather than as a build
// break. Every layer that lints today had already reached that conclusion on its own; collecting
// the decisions here is what lets a previously-unlinted layer switch lint on without going red.
//
// `jsPlugins` is resolved from this file's own URL, so a consumer at any depth inherits a working
// absolute path and never names the plugin itself.
export default defineConfig({
  env: { browser: true, es6: true, node: true },
  plugins: ["eslint", "import", "oxc", "unicorn", "typescript", "react", "jest", "jsx-a11y"],
  jsPlugins: [fileURLToPath(new URL("./src/suffix-imports.js", import.meta.url))],
  ignorePatterns: ["*.js", "*.cjs", "*.mjs", "node_modules"],
  categories: { correctness: "error", suspicious: "warn", pedantic: "off" },
  rules: {
    // Named by four or more layers today, at the value the majority chose. `no-explicit-any` is
    // the floor: the layers that want it fatal raise it themselves.
    "eslint/no-console": ["error", { allow: ["warn", "error"] }],
    "eslint/no-empty-pattern": "warn",
    "eslint/no-unused-vars": "warn",
    "import/no-duplicates": "error",
    "import/no-named-as-default": "off",
    "typescript/no-deprecated": "error",
    "typescript/no-explicit-any": "warn",
    "unicorn/no-useless-fallback-in-spread": "off",
    "unicorn/no-useless-spread": "off",

    // React Compiler rules. They ship in `correctness`, they fire in the hundreds across the repo,
    // and no layer enforces them; every React-bearing config demotes the ones it has met.
    "react/globals": "warn",
    "react/immutability": "warn",
    "react/jsx-key": "warn",
    "react/no-did-mount-set-state": "warn",
    "react/preserve-manual-memoization": "warn",
    "react/purity": "warn",
    "react/refs": "warn",
    "react/set-state-in-effect": "warn",
    "react/set-state-in-render": "warn",
    "react/static-components": "warn",
    "react/use-memo": "warn",
    "react/display-name": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    // Advisory test-style rules. Without these the previously-unlinted layers go red on test
    // style alone: `jest/require-to-throw-message` is 129 errors in domain/ by itself.
    "jest/expect-expect": "warn",
    "jest/no-conditional-expect": "warn",
    "jest/no-disabled-tests": "warn",
    "jest/require-to-throw-message": "warn",
    "jest/valid-title": "warn",

    // jsx-a11y assumes the DOM. These two are the ones that misfire on React Native.
    "jsx-a11y/anchor-is-valid": "off",
    "jsx-a11y/no-autofocus": "off",

    // Named by three or more of the layers that have not migrated yet, at the value they agree on.
    // Promoted here so their presets come out empty rather than repeating these lines.
    // `typescript/consistent-type-assertions` is deliberately not among them: the seven configs
    // that set it agree on the value, but none of the migrated layers ever had it and adopting it
    // here is 1485 new warnings. That is a policy call, not a consolidation, so it stays in the
    // leaves that already made it.
    "jest/no-export": "off",
    "jest/no-standalone-expect": "warn",
    "jest/valid-describe-callback": "warn",
    "jest/valid-expect": "warn",
    "typescript/no-empty-function": "off",
    "typescript/no-namespace": ["error", { allowDeclarations: true }],
    "unicorn/no-array-reverse": "off",

    // Demoted or disabled identically by every config that names them.
    "eslint/no-constant-binary-expression": "warn",
    "eslint/no-unsafe-optional-chaining": "off",
    "eslint/no-unused-expressions": "warn",
    "eslint/no-useless-rename": "warn",
    "import/namespace": "warn",
    "oxc/const-comparisons": "warn",
    "typescript/no-non-null-assertion": "off",
    "unicorn/no-new-array": "off",
    "unicorn/no-array-sort": "off",

    // Declared so any layer can flip it on without naming a plugin path. Only lint-devtools
    // enforces it today; the platform-suffix epic turns it on layer by layer, with its waiver
    // list living here as `**/`-prefixed globs (see README).
    "suffix-imports/no-platform-suffix": "off",
  },
  overrides: [
    {
      files: ["**/*.test.{ts,tsx}", "**/__tests__/**"],
      env: { jest: true },
      plugins: ["jest"],
      rules: {
        "typescript/no-explicit-any": "warn",
        "react/no-children-prop": "off",
      },
    },
    {
      // jsx-a11y encodes DOM and ARIA semantics. On React Native `role` is an ordinary prop with
      // its own vocabulary, and components define their own `role` too, so the rule misfires.
      files: ["**/*.native.*"],
      rules: { "jsx-a11y/aria-role": "off" },
    },
  ],
});
