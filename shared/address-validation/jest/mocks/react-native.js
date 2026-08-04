module.exports = {
  Platform: { OS: "ios", select: (obj) => obj.ios },
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) =>
      Array.isArray(style) ? Object.assign({}, ...style) : style || {},
  },
  View: "View",
  Text: "Text",
  ScrollView: "ScrollView",
};
