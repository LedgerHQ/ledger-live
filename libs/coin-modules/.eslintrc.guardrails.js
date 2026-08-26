// Passe ESLint "guardrails" pour les coin-modules — n'existe que pour la règle
// custom `no-external-type-alias-in-api`, qu'oxlint ne peut pas exprimer.
// Lancée séparément d'oxlint via le script `lint:coin-api-guardrails`.
// Voir aussi apps/ledger-live-desktop/.eslintrc.guardrails.js pour le même pattern.

module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  // Empêche de désactiver la règle en inline (// eslint-disable-...).
  noInlineConfig: true,
  // Les tests ne sont pas concernés — ignorés pour éviter tout bruit.
  ignorePatterns: ["**/*.test.ts", "**/*.integ.test.ts", "**/*.spec.ts"],
  overrides: [
    {
      // Uniquement les sources du répertoire `api` (pas les builds lib/ lib-es/).
      files: ["**/src/api/**/*.ts"],
      rules: {
        "no-external-type-alias-in-api": [
          "error",
          {
            // Types importés autorisés comme racine d'alias (avec ou sans generics).
            // À étendre au cas par cas. `Partial`, `Pick`, etc. ne sont PAS listés
            // -> `type B = Partial<ImportedType>` reste interdit.
            allowedTypes: ["CoinModuleApi", "Context", "TransactionIntent"],
            // Pour tolérer les imports relatifs internes à api, décommente :
            // ignoreSources: ["^\\./"],
          },
        ],
      },
    },
  ],
};
