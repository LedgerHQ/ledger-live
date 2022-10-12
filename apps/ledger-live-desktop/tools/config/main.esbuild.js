const path = require("path");
const common = require("./common.esbuild");
const { electronMainExternals, CopyPlugin } = require("esbuild-utils");

const rootFolder = path.resolve(__dirname, "..", "..");

module.exports = {
  ...common,
  entryPoints: ["./src/index.js"],
  entryNames: "main.bundle",
  target: ["node12"],
  platform: "node",
  format: "cjs",
  // Some modules have different exports signatures depending on the main field. (for instance bignumber.js)
  // Picking the the main field first is safer.
  // See this comment: https://github.com/webpack/webpack/issues/4742#issuecomment-295115576
  mainFields: ["main", "module"],
  external: [...electronMainExternals],
  plugins: [
    ...common.plugins,
    CopyPlugin({
      patterns: [{ from: path.join(rootFolder, "build/icons"), to: "build/icons" }],
    }),
  ],
};
