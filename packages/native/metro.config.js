const path = require("path");
const monoRepoRoot = path.resolve(__dirname, "..", "..");
const blockList = new RegExp(
  `^(${__dirname}/lib/.*|${monoRepoRoot}/packages/react/.*)`
);

module.exports = {
  watchFolders: [monoRepoRoot],
  resolver: {
    resolverMainFields: ["typescriptMain", "browser", "main"],
    blacklistRE: blockList,
    blockList: blockList,
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};
