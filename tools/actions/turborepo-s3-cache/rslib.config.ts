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
    cleanDistPath: true,
    minify: false,
    sourceMap: false,
    externals: [], // Bundle everything for GitHub Actions
  },
  lib: [
    {
      format: "cjs",
      bundle: true,
      autoExternal: {
        dependencies: false, // Bundle all dependencies for GitHub Actions
        peerDependencies: true,
        devDependencies: true,
        optionalDependencies: true,
      }
    },
  ],
});
