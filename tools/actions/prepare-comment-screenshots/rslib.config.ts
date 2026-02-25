import { defineConfig } from "@rslib/core";

export default defineConfig({
  source: {
    entry: {
      main: "./main.ts",
    },
  },
  output: {
    target: "node",
    distPath: {
      root: "build",
    },
  },
  lib: [
    {
      format: "cjs",
    },
  ],
});
