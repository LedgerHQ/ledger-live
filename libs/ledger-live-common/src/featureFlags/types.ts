// Add others with union (e.g. "learn" | "market" | "foo")
export type FeatureId =
  | "learn"
  | "pushNotifications"
  | "llmUsbFirmwareUpdate"
  | "ratings"
  | "buyDeviceFromLive"
  | string;

// We use objects instead of direct booleans for potential future improvements
// like feature versioning etc
export type Feature = {
  enabled: boolean;
  params?: any;
};

export type DefaultFeatures = { [key in FeatureId]: Feature };
