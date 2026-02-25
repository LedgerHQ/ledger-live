import { Feature, FeatureId } from "@ledgerhq/types-live";
import { LiveAppManifest } from "../../platform/types";

export type GetFeatureFn = (featureId: FeatureId) => Feature | null;

export function getFeatureFlagsForLiveApp({
  requestedFeatureFlagIds,
  manifest,
  getFeature,
}: {
  requestedFeatureFlagIds: string[];
  manifest: LiveAppManifest;
  getFeature: GetFeatureFn;
}): Record<string, Feature<unknown> | null> {
  // Check if wildcard is present - if so, allow all feature flags
  const manifestFeatureFlags = manifest.featureFlags;

  // Filter requested IDs to only allowed ones (unless wildcard is present)
  let featureFlagIdsToFetch: string[];
  if (manifestFeatureFlags === "*") {
    // Wildcard: allow all requested feature flags
    featureFlagIdsToFetch = requestedFeatureFlagIds;
  } else if (Array.isArray(manifestFeatureFlags)) {
    // Array: filter to only allowed feature flags
    featureFlagIdsToFetch = requestedFeatureFlagIds.filter(id => manifestFeatureFlags.includes(id));
  } else {
    // No feature flags defined
    featureFlagIdsToFetch = [];
  }

  // Fetch each feature flag
  const features: Record<string, Feature<unknown> | null> = {};

  for (const featureFlagId of featureFlagIdsToFetch) {
    try {
      const feature = getFeature(featureFlagId as FeatureId);
      features[featureFlagId] = feature;
    } catch (_error) {
      // If feature doesn't exist or error occurs, set to null
      features[featureFlagId] = null;
    }
  }

  return features;
}
