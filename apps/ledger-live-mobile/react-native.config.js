module.exports = {
  commands: require("@callstack/repack/commands/rspack"),
  dependencies: {
    "react-native-get-random-values": {
      platforms: { ios: null, android: null },
    },
  },
  assets: [
    "./assets/fonts/",
    "./assets/videos/",
    "node_modules/@ledgerhq/native-ui/lib/assets/fonts/alpha",
    "node_modules/@ledgerhq/native-ui/lib/assets/fonts/inter",
  ],
};
