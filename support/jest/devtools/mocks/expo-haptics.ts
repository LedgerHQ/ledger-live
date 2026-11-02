// Mapped in via moduleNameMapper rather than jest.mock: this file is shared, so resolving
// "expo-haptics" from here would pick a different pnpm instance than the one lumen imports in the
// consumer, and the mock would silently miss.

export const impactAsync = jest.fn().mockResolvedValue(undefined);
export const notificationAsync = jest.fn().mockResolvedValue(undefined);
export const selectionAsync = jest.fn().mockResolvedValue(undefined);

export const ImpactFeedbackStyle = {
  Light: "light",
  Medium: "medium",
  Heavy: "heavy",
  Soft: "soft",
  Rigid: "rigid",
};

export const NotificationFeedbackType = {
  Success: "success",
  Warning: "warning",
  Error: "error",
};
