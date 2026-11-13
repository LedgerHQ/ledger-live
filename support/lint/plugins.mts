import { fileURLToPath } from "node:url";

/** Absolute path of the `suffix-imports` oxlint JS plugin, for a config's `jsPlugins`. */
export const SUFFIX_IMPORTS_PLUGIN = fileURLToPath(
  new URL("./src/suffix-imports.js", import.meta.url),
);

/** Absolute path of the `redux-slices` oxlint JS plugin, for a config's `jsPlugins`. */
export const REDUX_SLICES_PLUGIN = fileURLToPath(new URL("./src/redux-slices.js", import.meta.url));
