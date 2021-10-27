const path = require("path");

const monoRepoRoot = path.resolve(__dirname, "..", "..");

module.exports = {
  watchFolders: [monoRepoRoot],
  resolver: {
    resolverMainFields: ["typescriptMain", "browser", "main"],
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
