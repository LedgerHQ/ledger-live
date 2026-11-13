import { fileURLToPath } from "node:url";

/** Absolute path of the `suffix-imports` oxlint JS plugin, for a config's `jsPlugins`. */
export const SUFFIX_IMPORTS_PLUGIN = fileURLToPath(
  new URL("./src/suffix-imports.js", import.meta.url),
);
