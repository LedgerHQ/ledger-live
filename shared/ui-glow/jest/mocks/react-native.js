const reactNative = jest.requireActual("@support/jest/shared/mocks/react-native");

module.exports = {
  ...reactNative,
  // Native views from codegen render as plain host components.
  codegenNativeComponent: name => name,
};
