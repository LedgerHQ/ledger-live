import { defineConfig } from "@rslib/core";

export default defineConfig({
  source: {
    entry: {
      index: "./src/index.ts",
    },
  },
  output: {
    target: "node",
    distPath: {
      root: "lib",
    },
    cleanDistPath: true,
    externals: [
      // All @ledgerhq/* packages are pre-built in the monorepo — keep them external
      // to avoid bundling the entire live-common ecosystem (43MB → ~1MB bundle).
      // Exception: live-dmk-shared serves ESM-only and must be bundled (rslib transforms it).
      // FIXME: When re-adding DMK support, also add @ledgerhq/device-management-kit and
      //        @ledgerhq/device-transport-kit-node-hid back to this externals list so that
      //        DMK and its transport share the same rxjs instance (avoids Observable mismatch).
      /^@ledgerhq\/(?!live-dmk-shared)/,
      // rxjs must be shared so all packages use the same Observable class
      "rxjs",
      /^rxjs\//,
      // Heavy / native / already-resolved deps
      "bignumber.js",
      "bigint-buffer",
      "node-hid",
      /^readable-stream/,
      "winston",
      "winston-transport",
      "commander",
      // chalk and ora are ESM-only — keep bundled (rslib transforms ESM→CJS)
    ],
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
      output: {
        filename: {
          js: "[name].cjs",
        },
      },
    },
  ],
});
