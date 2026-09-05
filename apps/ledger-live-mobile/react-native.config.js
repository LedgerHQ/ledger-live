const android = require("@react-native-community/cli-platform-android");
const ios = require("@react-native-community/cli-platform-ios");

module.exports = {
  commands: require("@callstack/repack/commands/rspack"),
  platforms: {
    ios: {
      projectConfig: ios.projectConfig,
      dependencyConfig: ios.dependencyConfig,
    },
    android: {
      projectConfig: android.projectConfig,
      dependencyConfig: android.dependencyConfig,
    },
  },
  assets: [
    "./assets/fonts/",
    "./assets/videos/",
    "node_modules/@ledgerhq/native-ui/lib/assets/fonts/alpha",
    "node_modules/@ledgerhq/native-ui/lib/assets/fonts/inter",
  ],
};
