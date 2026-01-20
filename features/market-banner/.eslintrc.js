// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const path = require("path");

// Load desktop and mobile configs
const desktopConfig = require("../../apps/ledger-live-desktop/.eslintrc.js");
const mobileConfig = require("../../apps/ledger-live-mobile/.eslintrc.js");

module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: path.join(__dirname, "tsconfig.test.json"),
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "better-tailwindcss"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
  ],
  ignorePatterns: ["*.js", "*.cjs", "*.mjs"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    // Base rules from mobile config
    ...mobileConfig.rules,
    "react/react-in-jsx-scope": "off",
    // Disable rules that require plugins not installed in this package
    "i18next/no-literal-string": "off",
    "jsx-a11y/anchor-is-valid": "off",
  },
  overrides: [
    // Apply desktop rules to .web files
    {
      files: ["**/*.web.{ts,tsx}"],
      extends: ["plugin:better-tailwindcss/recommended"],
      rules: {
        ...desktopConfig.rules,
        // Disable rules that require plugins not installed in this package
        "i18next/no-literal-string": "off",
        "jsx-a11y/anchor-is-valid": "off",
        "better-tailwindcss/enforce-consistent-line-wrapping": "off",
      },
      settings: {
        ...desktopConfig.settings,
        "better-tailwindcss": {
          entryPoint: path.join(
            __dirname,
            "../../apps/ledger-live-desktop/src/renderer/global.css",
          ),
          callees: ["cn"],
        },
      },
    },
    // Apply mobile rules to .native files
    {
      files: ["**/*.native.{ts,tsx}"],
      rules: {
        ...mobileConfig.rules,
        "i18next/no-literal-string": "off",
        "jsx-a11y/anchor-is-valid": "off",
      },
    },
  ],
};
