import { defineConfig } from "oxfmt";

// Every one of the 29 `.oxfmtrc.json` files this replaces carried these four settings, byte for
// byte; `ignorePatterns` was the only field that ever differed between them.
//
// The patterns work here because oxfmt resolves them against the directory of the config it found,
// which is the layer config naming this preset, not this file. `**/build/**` covers the bundled
// output `tools/actions/*` commit because GitHub Actions run it directly.
export default defineConfig({
  ignorePatterns: ["**/*.md", "**/*.json", "**/build/**"],
  printWidth: 100,
  trailingComma: "all",
  arrowParens: "avoid",
  sortPackageJson: false,
});
