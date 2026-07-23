// Minimal react-native stub so native tests run in a plain node env without booting the RN
// runtime (whose index.js is Flow-typed ESM). Mapped via moduleNameMapper so it intercepts
// every `react-native` import, including from @testing-library/react-native.
module.exports = {
  Platform: { OS: "ios", select: obj => obj.ios },
  StyleSheet: {
    create: styles => styles,
    flatten: style => (Array.isArray(style) ? Object.assign({}, ...style) : style || {}),
  },
  View: "View",
  Text: "Text",
  Image: "Image",
};
