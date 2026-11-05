module.exports = {
  commands: require("@callstack/repack/commands/rspack"),
  dependencies: {
    // Expo autolinking links transitive native deps; JS is aliased to the expo-crypto shim (LIVE-37309)
    "react-native-get-random-values": {
      platforms: { ios: null, android: null },
    },
    // node-libs-react-native still installs it; the crypto fallback is crypto-browserify (LIVE-21311)
    "react-native-randombytes": {
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
