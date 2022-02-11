/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const defaultSourceExts = require("metro-config/src/defaults/defaults")
  .sourceExts;
const resolve = require("metro-resolver").resolve

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    sourceExts: [...defaultSourceExts, 'cjs'],
    resolveRequest: (context, realModuleName, platform, moduleName) => {
      const { resolveRequest: removed, ...restContext} = context;

      let module = realModuleName;
      // When resolveRequest exist, ripple-lib doesn't seems to be able to find ws.
      if (moduleName === 'ws') {
        return {
          type: 'sourceFile',
          filePath: `${__dirname}/node_modules/ws/browser.js`
        }
      }

      // Patch for polkadot, because inside of packageInfo.js they used
      // import.meta that is still not avaible
      if (
        context.originModulePath.includes("@polkadot") &&
        moduleName === "./packageInfo.js"
      ) {
        module = module.replace(".js", ".cjs");
      }

      return resolve(restContext, module, platform);
    },
  }
};
