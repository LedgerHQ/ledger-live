module.exports = {
  commands: require("@callstack/repack/commands/rspack"),
  assets: [
    "./assets/fonts/",
    "./assets/videos/",
    "node_modules/@ledgerhq/native-ui/lib/assets/fonts/alpha",
    "node_modules/@ledgerhq/native-ui/lib/assets/fonts/inter",
  ],
  dependencies: {
    // This package is not used in the app code and conflicts with the active ML Kit iOS pod.
    "react-native-mlkit-ocr": {
      platforms: {
        ios: null,
      },
    },
  },
};
