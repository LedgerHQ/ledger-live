import { defineConfig } from "@rslib/core";

export default defineConfig({
  source: {
    entry: {
      main: "./src/main.ts",
      server: "./src/server.ts",
      cleanup: "./src/cleanup.ts",
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
