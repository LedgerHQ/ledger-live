module.exports = {
  commands: require("@callstack/repack/commands/webpack"),
  assets: [
    "./assets/fonts/",
    "./assets/videos/",
    "node_modules/@ledgerhq/native-ui/lib/assets/fonts/alpha",
    "node_modules/@ledgerhq/native-ui/lib/assets/fonts/inter",
  ],
};
