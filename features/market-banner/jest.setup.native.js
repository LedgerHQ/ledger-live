// Setup file for React Native tests

// Mock react-native
jest.mock("react-native", () => ({
  Platform: { OS: "ios", select: jest.fn(obj => obj.ios) },
  StyleSheet: {
    create: styles => styles,
    flatten: style => (Array.isArray(style) ? Object.assign({}, ...style) : style || {}),
  },
  View: "View",
  Text: "Text",
}));

// Mock @ledgerhq/lumen-ui-rnative
jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const React = require("react");
  return {
    Box: ({ children, ...props }) => React.createElement("View", props, children),
    Text: ({ children, ...props }) => React.createElement("Text", props, children),
  };
});
