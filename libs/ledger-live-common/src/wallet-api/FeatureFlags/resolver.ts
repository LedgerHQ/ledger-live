import { getFeature } from "../../featureFlags/firebaseFeatureFlags";
import { Feature, FeatureId } from "@ledgerhq/types-live";
import { LiveAppManifest } from "../../platform/types";

export function getFeatureFlagsForLiveApp({
  requestedFeatureFlagIds,
  manifest,
  appLanguage,
}: {
  requestedFeatureFlagIds: string[];
  manifest: LiveAppManifest;
  appLanguage?: string;
}): Record<string, Feature<unknown> | null> {
  // Only allow feature flags explicitly declared in the manifest
  const allowedFeatureFlagIds = new Set(manifest.featureFlags || []);

  // Filter requested IDs to only allowed ones
  const featureFlagIdsToFetch = requestedFeatureFlagIds.filter(id => allowedFeatureFlagIds.has(id));

  // Fetch each feature flag
  const features: Record<string, Feature<unknown> | null> = {};

  for (const featureFlagId of featureFlagIdsToFetch) {
    try {
      const feature = getFeature({
        key: featureFlagId as FeatureId,
        appLanguage,
        allowOverride: true,
      });
      features[featureFlagId] = feature;
    } catch (_error) {
      // If feature doesn't exist or error occurs, set to null
      features[featureFlagId] = null;
    }
  }

  return features;
}
