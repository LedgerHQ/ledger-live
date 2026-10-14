/**
 * ESLint config for better-tailwindcss only (no oxlint equivalent).
 * Run via: pnpm lint:tailwind
 * Applies to *.web.{ts,tsx} files only.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const path = require("path");

module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["better-tailwindcss"],
  extends: ["plugin:better-tailwindcss/legacy-recommended"],
  ignorePatterns: ["*.js", "*.cjs", "*.mjs", "node_modules"],
  rules: {
    "better-tailwindcss/enforce-consistent-line-wrapping": "off",
  },
  settings: {
    "better-tailwindcss": {
      entryPoint: path.join(__dirname, "../../platform/style/tailwind.css"),
      callees: ["cn"],
    },
  },
  overrides: [
    {
      files: ["**/*.web.{ts,tsx}"],
    },
  ],
};
