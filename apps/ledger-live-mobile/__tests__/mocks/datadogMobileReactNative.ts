/**
 * Datadog RUM feature operations for Jest. The SDK's own `jest/mock.js` throws on
 * `failFeatureOperation`, so mock the SDK with this module instead:
 *
 * jest.mock("@datadog/mobile-react-native", () => require("@tests/mocks/datadogMobileReactNative"));
 */
export const DdRum = {
  startFeatureOperation: jest.fn(() => Promise.resolve()),
  succeedFeatureOperation: jest.fn(() => Promise.resolve()),
  failFeatureOperation: jest.fn(() => Promise.resolve()),
};

export const FeatureOperationFailure = {
  ERROR: "ERROR",
  ABANDONED: "ABANDONED",
  OTHER: "OTHER",
} as const;
