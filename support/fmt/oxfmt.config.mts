import { defineConfig } from "oxfmt";

// The repository's only oxfmt config. The workspace root re-exports it, and every oxfmt run finds it
// by walking up from where it starts: the git hook, package scripts and the editor extension.
//
// oxfmt anchors `ignorePatterns` to the directory of the config it found, the workspace root, so a
// pattern scoped to one package names that package's path. Order matters: a `!` pattern re-includes
// what an earlier one excluded.
export default defineConfig({
  printWidth: 100,
  trailingComma: "all",
  arrowParens: "avoid",
  sortPackageJson: false,
  ignorePatterns: [
    "**/*.md",

    // JSON is left alone, except in the trees that have always formatted it.
    "**/*.json",
    "!apps/ledger-live-desktop/**/*.json",
    "apps/ledger-live-desktop/static/i18n/**",
    "apps/ledger-live-desktop/**/animations/**/*.json",
    "!libs/coin-tester/**/*.json",
    "!libs/coin-tester-modules/**/*.json",
    "libs/coin-tester/**/fixtures/**/*.json",
    "libs/coin-tester-modules/**/fixtures/**/*.json",
    "libs/coin-tester/**/*.fixture.json",
    "libs/coin-tester-modules/**/*.fixture.json",
    "!libs/ledger-services/**/*.json",

    // Generated, vendored or bundled sources.
    "**/skills/manifest.gen.ts",
    "apps/ledger-live-mobile/src/generated/**",
    "apps/wallet-cli/dist/**",
    "apps/wallet-cli/.bunli/commands.gen.ts",
    "libs/ledger-live-common/src/load/tokens/**",
    "libs/ledger-live-common/src/crypto/sha256.js",
    "libs/ledger-live-common/src/data/icons/**",
    "libs/ledger-live-common/src/deviceSDK/tasks/genuineCheck.ts",
    "tools/**/build/**",
  ],
});
