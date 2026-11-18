const reactNative = jest.requireActual("@support/jest/shared/mocks/react-native");

module.exports = {
  ...reactNative,
  // A native view renders as a host element named after it, its props readable in tests.
  requireNativeComponent: name => name,
};
