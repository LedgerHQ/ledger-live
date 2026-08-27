// ESLint "guardrails" pass for the coin-modules — only exists for the custom
// rules that oxlint cannot express (`no-external-type-alias-in-api`, ...).
// Run separately from oxlint through the `lint:coin-api-guardrails` script.
// See also apps/ledger-live-desktop/.eslintrc.guardrails.js for the same pattern.

module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  // Prevents disabling the rule inline (// eslint-disable-...).
  noInlineConfig: true,
  // Tests are out of scope — ignored to avoid any noise.
  ignorePatterns: ["**/*.test.ts", "**/*.integ.test.ts", "**/*.spec.ts"],
  overrides: [
    {
      // Only the sources of the `api` directory (not the lib/ lib-es/ builds).
      files: ["**/src/api/**/*.ts"],
      rules: {
        "no-external-type-alias-in-api": [
          "error",
          {
            // Imported types allowed as an alias root (with or without generics).
            // Extend on a case-by-case basis. `Partial`, `Pick`, etc. are NOT listed
            // -> `type B = Partial<ImportedType>` stays forbidden.
            allowedTypes: ["CoinModuleApi", "Context", "TransactionIntent"],
            // To tolerate relative imports internal to api, uncomment:
            // ignoreSources: ["^\\./"],
          },
        ],
        // Types used in the signatures of the CoinModuleApi implementation functions
        // must be defined in `api/types.ts` (framework types stay allowed).
        // Kept as `warn` to help the migration.
        "coin-module-api-types-in-types-file": [
          "warn",
          {
            interfaceTypes: ["CoinModuleApi"],
            frameworkSources: ["^@ledgerhq/coin-module-framework(/|$)"],
            localTypesSources: ["^\\./types(\\.ts)?$"],
          },
        ],
      },
    },
  ],
};
