const path = require("path");
const { AliasPlugin, StripFlowPlugin } = require("esbuild-utils");

const rootFolder = path.resolve(__dirname, "..", "..");
const srcFolder = path.resolve(rootFolder, "src");

module.exports = {
  bundle: true,
  outdir: path.resolve(rootFolder, ".webpack"),
  absWorkingDir: rootFolder,
  // Lower the log level in order to debug the build
  logLevel: "info",
  nodePaths: ["node_modules", path.resolve(rootFolder, "node_modules")],
  sourcemap: true,
  minify: true,
  color: true,
  metafile: true,
  plugins: [
    AliasPlugin({
      "~": srcFolder,
    }),
    StripFlowPlugin(/\.jsx?$/),
  ],
  loader: {
    ".woff": "file",
    ".woff2": "file",
    ".eot": "file",
    ".ttf": "file",
    ".otf": "file",
    ".png": "dataurl",
    ".jpg": "dataurl",
    ".jpeg": "dataurl",
    ".gif": "dataurl",
    ".svg": "dataurl",
  },
  logOverride: {
    "this-is-undefined-in-esm": "silent",
    "ignored-bare-import": "debug",
  },
};
