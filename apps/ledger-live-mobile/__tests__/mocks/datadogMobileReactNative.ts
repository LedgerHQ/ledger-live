// The SDK's own jest/mock.js throws on failFeatureOperation.
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
