module.exports = {
  // Register Re.Pack commands
  commands: require('@callstack/repack/commands/rspack'),
  
  // Maintain existing asset configuration
  assets: [
    "./assets/fonts/",
    "./assets/videos/",
    "node_modules/@ledgerhq/native-ui/lib/assets/fonts/alpha",
    "node_modules/@ledgerhq/native-ui/lib/assets/fonts/inter",
  ],
};
