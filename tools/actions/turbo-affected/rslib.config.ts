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
  },
  lib: [
    {
      format: "cjs",
    },
  ],
});
