const reactNative = jest.requireActual("@support/jest/shared/mocks/react-native");

module.exports = {
  ...reactNative,
  AccessibilityInfo: { announceForAccessibility: jest.fn() },
};
