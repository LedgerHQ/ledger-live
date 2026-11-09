import { defineConfig } from "@rslib/core";

export default defineConfig({
  source: {
    entry: {
      cli: "./src/cli.ts",
    },
  },
  output: {
    target: "node",
    distPath: {
      root: "lib",
    },
    cleanDistPath: true,
    externals: ["bigint-buffer", /^readable-stream/, "@ledgerhq/zcash-utils"],
    minify: false,
    autoExternal: {
      dependencies: false,
      peerDependencies: true,
      devDependencies: true,
      optionalDependencies: true,
    },
  },
  lib: [
    {
      format: "cjs",
      bundle: true,
    },
  ],
  tools: {
    rspack: {
      module: {
        parser: {
          javascript: {
            dynamicImportMode: "eager",
          },
        },
      },
    },
  },
});
