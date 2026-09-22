// Minimal react-native stub so native tests run in a plain node env without booting the RN
// runtime (whose index.js is Flow-typed ESM). Mapped via moduleNameMapper so it intercepts
// every `react-native` import, including from @testing-library/react-native.
module.exports = {
  Platform: { OS: "ios", select: obj => obj.ios },
  // Native modules a flow imports transitively (react-native-keychain) read this at module eval.
  NativeModules: {
    AppleWalletModule: { openPaymentSetup: jest.fn(() => Promise.resolve()) },
    GoogleWalletModule: { openWallet: jest.fn(() => Promise.resolve()) },
  },
  StyleSheet: {
    create: styles => styles,
    flatten: style => (Array.isArray(style) ? Object.assign({}, ...style) : style || {}),
  },
  View: "View",
  Pressable: "Pressable",
  Text: "Text",
  Image: "Image",
  ScrollView: "ScrollView",
  Keyboard: {
    isVisible: () => false,
    dismiss: () => {},
  },
  Linking: {
    openURL: jest.fn(() => Promise.resolve()),
    sendIntent: jest.fn(() => Promise.resolve()),
    openSettings: jest.fn(() => Promise.resolve()),
  },
};
