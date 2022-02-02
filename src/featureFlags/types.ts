export type FeatureId = "market"; // Add others with union

// We use objects instead of direct booleans for potential future improvements
// like feature versioning etc
export type Feature = {
  enabled: boolean;
};

export type DefaultFeatures = { [key in FeatureId]: Feature };
