import { defineConfig } from "@rslib/core";

export default defineConfig({
  source: {
    entry: {
      main: "./src/main.ts",
    },
  },
  output: {
    target: "node",
    distPath: {
      root: "build",
    },
    cleanDistPath: true,
    minify: false,
    sourceMap: false,
  },
  lib: [
    {
      format: "cjs",
      bundle: true,
    },
  ],
});
