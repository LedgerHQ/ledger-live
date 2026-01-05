import { defineConfig } from "tsup";

export default defineConfig([
  {
    name: "web",
    entry: { index: "src/index.ts" },
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    platform: "browser",
    outDir: "dist/web",
    external: ["react", "react-dom", "react-redux", "@reduxjs/toolkit", "@ledgerhq/live-env"],
  },
  {
    name: "native",
    entry: { "index.native": "src/index.native.ts" },
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    treeshake: true,
    platform: "neutral",
    outDir: "dist/native",
    external: ["react", "react-native", "react-redux", "@reduxjs/toolkit", "@ledgerhq/live-env"],
  },
]);
