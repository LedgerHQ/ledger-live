const reactNative = jest.requireActual("@support/jest/shared/mocks/react-native");

module.exports = {
  ...reactNative,
  AccessibilityInfo: { announceForAccessibility: jest.fn() },
  // Native views from codegen (the GPU glow) render as plain host components.
  codegenNativeComponent: name => name,
};
