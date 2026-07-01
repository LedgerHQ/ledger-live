// shell.openExternal guard — uses a no-restricted-syntax AST selector that oxlint cannot express.

const shellOpenExternalRestrictions = [
  {
    selector: "CallExpression[callee.object.name='shell'][callee.property.name='openExternal']",
    message:
      "Do not use shell.openExternal() directly. In renderer code, use openURL() from '~/renderer/linking' instead to prevent RCE vulnerabilities. In main-process code, validate the URL with isUrlSafe before calling shell.openExternal. See: https://www.electronjs.org/docs/latest/tutorial/security#15-do-not-use-openexternal-with-untrusted-content",
  },
  {
    selector: "MemberExpression[object.name='shell'][property.name='openExternal']",
    message:
      "Do not use shell.openExternal directly. In renderer code, use openURL() from '~/renderer/linking'. In main-process code, validate the URL with isUrlSafe before calling shell.openExternal.",
  },
];

module.exports = {
  env: { browser: true, es2022: true, node: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 2022,
    sourceType: "module",
  },
  noInlineConfig: true,
  overrides: [
    {
      files: ["src/**/*.ts", "src/**/*.tsx"],
      excludedFiles: ["src/renderer/linking.ts", "src/main/openURL.ts"],
      rules: {
        "no-restricted-syntax": ["error", ...shellOpenExternalRestrictions],
      },
    },
  ],
};
