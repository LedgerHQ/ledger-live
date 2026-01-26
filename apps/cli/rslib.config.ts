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
    externals: [
      "bigint-buffer",
      "usb",
      "node-hid",
      "qrcode-terminal",
      /^readable-stream/,
      "winston",
      "winston-transport",
      "superagent",
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
    },
  ],
});
