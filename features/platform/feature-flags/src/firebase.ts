import snakeCase from "lodash/snakeCase";
import type { FeatureMap } from "@shared/feature-flags";

/**
 * Maps a feature flag id to its Firebase Remote Config key (`feature_${snake_case(id)}`).
 * Platform-specific: matches the naming convention used in our Firebase project.
 */
export function formatToFirebaseFeatureId(id: string): string {
  return `feature_${snakeCase(id)}`;
}

/**
 * Formats a default-features map into the Firebase Remote Config defaults shape — keyed by Firebase
 * feature id, with each value JSON-stringified (the Firebase SDK stores values as strings).
 */
export function formatDefaultFeatures(config: FeatureMap): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const [featureId, feature] of Object.entries(config)) {
    defaults[formatToFirebaseFeatureId(featureId)] = JSON.stringify(feature);
  }
  return defaults;
}
