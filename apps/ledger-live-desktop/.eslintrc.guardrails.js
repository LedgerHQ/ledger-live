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

const sendRestrictions = [
  {
    selector: "BinaryExpression[operator=/^[=!]==?$/] MemberExpression[property.name='family']",
    message:
      "Send must not branch on `.family`. Move family-specific behavior behind the send flow/families contract.",
  },
  {
    selector: "CallExpression[callee.property.name='includes'] MemberExpression[property.name='family']",
    message:
      "Send must not check `.family` with includes(). Move family-specific behavior behind the send flow/families contract.",
  },
  {
    selector:
      "SwitchStatement[discriminant.property.name='family'], SwitchStatement[discriminant.expression.property.name='family']",
    message:
      "Send must not switch on `.family`. Move family-specific behavior behind the send flow/families contract.",
  },
];

const sendImportRestrictions = [
  {
    group: ["@ledgerhq/coin-*", "@ledgerhq/coin-*/**"],
    message:
      "Send must not import coin modules. Move family-specific behavior behind the send flow/families contract.",
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
    {
      files: ["src/mvvm/features/Send/**/*.ts", "src/mvvm/features/Send/**/*.tsx"],
      rules: {
        "no-restricted-imports": ["error", { patterns: sendImportRestrictions }],
        "no-restricted-syntax": ["error", ...sendRestrictions],
      },
    },
  ],
};
