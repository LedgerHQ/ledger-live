/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const defaultSourceExts = require("metro-config/src/defaults/defaults")
  .sourceExts;

module.exports = {
  resolver: {
    sourceExts: ["tsx", "ts", "jsx", "js", "json", "cjs"],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
