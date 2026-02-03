import path from "path";
import { defineConfig } from "@rsbuild/core";
import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact(), pluginNodePolyfill()],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json", ".mdx"],
    modules: [path.resolve(__dirname, "node_modules"), "node_modules"],
    fallback: {
      os: require.resolve("os-browserify/browser"),
      tty: require.resolve("tty-browserify"),
    },
  },
});
