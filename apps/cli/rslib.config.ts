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
    externals: ["bigint-buffer", /^readable-stream/],
    minify: false,
  },
  lib: [
    {
      format: "cjs",
      bundle: true,
      autoExternal: {
        dependencies: false,
        peerDependencies: true,
        devDependencies: true,
        optionalDependencies: true,
      },
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
