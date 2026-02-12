/**
 * Pure helpers for the new send flow feature config.
 * No feature-flag or React deps — safe to unit test.
 */

export type NewSendFlowFeatureParams = {
  enabled?: boolean;
  params?: { families?: unknown };
};

/**
 * Returns whether the feature config is valid (enabled + non-empty families array).
 */
export function isValidNewSendFlowConfig(
  feature: NewSendFlowFeatureParams | null | undefined,
): boolean {
  const enabled = feature?.enabled;
  const families = feature?.params?.families;
  return Boolean(enabled && Array.isArray(families) && families.length > 0);
}

/**
 * Returns the list of allowed families (empty array if not an array).
 */
export function getNewSendFlowAllowedFamilies(
  feature: NewSendFlowFeatureParams | null | undefined,
): readonly string[] {
  const families = feature?.params?.families;
  return Array.isArray(families) ? families : [];
}

/**
 * Returns true if the new send flow is enabled for the given family.
 * When config is invalid: false.
 * When family is undefined: true (no filter).
 * Otherwise: true iff family is in allowedFamilies.
 */
export function isFamilyAllowedForNewSendFlow(
  family: string | undefined,
  allowedFamilies: readonly string[],
  isConfigValid: boolean,
): boolean {
  if (!isConfigValid) return false;
  if (family === undefined || family === "") return true;
  return allowedFamilies.includes(family);
}
