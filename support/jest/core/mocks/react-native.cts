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
  // Rendered only while visible, like react-native's own mock, and reports it's on screen once it
  // becomes visible. Tests fire its `requestClose` event for the Android back button.
  Modal: function Modal(props) {
    const React = require("react");
    const isVisible = props.visible !== false;
    const onShowRef = React.useRef(props.onShow);
    onShowRef.current = props.onShow;
    React.useEffect(() => {
      if (isVisible) onShowRef.current?.();
    }, [isVisible]);
    return isVisible ? React.createElement("Modal", props, props.children) : null;
  },
  Keyboard: {
    isVisible: () => false,
    dismiss: () => {},
    // Inert by default; tests that drive the keyboard spy on this and call the listener themselves.
    addListener: () => ({ remove: () => {} }),
  },
  // Foreground by default; a test that drives the lifecycle overrides addEventListener to keep
  // the listener it is handed.
  AppState: {
    currentState: "active",
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Linking: {
    openURL: jest.fn(() => Promise.resolve()),
    sendIntent: jest.fn(() => Promise.resolve()),
    openSettings: jest.fn(() => Promise.resolve()),
  },
};
