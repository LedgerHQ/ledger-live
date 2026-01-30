import { defineConfig } from "@rslib/core";

export default defineConfig({
  source: {
    entry: {
      "cli-test": "./cli-test.ts",
    },
  },
  output: {
    target: "node",
    distPath: {
      root: "build-cli",
    },
  },
  lib: [
    {
      format: "cjs",
    },
  ],
});
