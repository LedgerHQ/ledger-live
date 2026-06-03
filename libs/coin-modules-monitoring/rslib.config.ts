import { defineConfig } from "@rslib/core";

// Bundle the CLI and its @ledgerhq deps into a single CJS file. Running the
// bundle sidesteps the bundler-only assumptions in lib-es (extensionless
// imports, esModuleInterop, require(), JSON imports): the bundler resolves
// them at build time.
export default defineConfig({
  source: { entry: { cli: "./src/cli.ts" } },
  output: { target: "node", distPath: { root: "lib" }, minify: false },
  // autoExternal defaults to externalizing all deps; bundle the @ledgerhq ones in.
  lib: [{ format: "cjs", bundle: true, autoExternal: { dependencies: false } }],
});
