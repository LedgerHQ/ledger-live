module.exports = {
  dependencies: {
    ...(process.env.NO_FLIPPER ? { "react-native-flipper": { platforms: { ios: null } } } : {}),
  },
  assets: [
    "./assets/fonts/",
    "./assets/videos/",
    "node_modules/@ledgerhq/native-ui/lib/assets/fonts/alpha",
    "node_modules/@ledgerhq/native-ui/lib/assets/fonts/inter",
  ],
};
