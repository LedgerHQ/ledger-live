import { defineConfig } from "oxfmt";

// Every one of the 29 `.oxfmtrc.json` files this replaces carried these four settings, byte for
// byte; `ignorePatterns` was the only field that ever differed between them.
//
// `ignorePatterns` deliberately does not appear here. oxfmt anchors it to the *config file's*
// directory, and unlike oxlint's `overrides[].files` a `**/` prefix does not rescue it: from
// `support/fmt-base/`, `**/*.md` means `support/fmt-base/**/*.md` and matches nothing. The baseline
// excludes therefore live in `bin/fmt-base.mjs`, which passes them as oxfmt `!` positionals
// relative to the consumer's own directory. oxfmt's schema has no `extends`, so this preset does
// not chain either.
export default defineConfig({
  printWidth: 100,
  trailingComma: "all",
  arrowParens: "avoid",
  sortPackageJson: false,
});
