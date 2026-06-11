import {
  flagRegistry,
  FeatureIdSchema,
  type FeatureId,
  type PartialFeatures,
} from "@shared/feature-flags";

export interface OverridesImport {
  overrides: PartialFeatures;
  warnings: string[];
}

function isFeatureId(id: string): id is FeatureId {
  return FeatureIdSchema.safeParse(id).success;
}

/**
 * Writes `value` as the override for `id` if it matches that flag's schema.
 * Returns whether the value was kept.
 */
function assignOverride<K extends FeatureId>(
  target: PartialFeatures,
  id: K,
  value: unknown,
): boolean {
  const result = flagRegistry[id].safeParse(value);
  if (!result.success) return false;
  // safeParse guarantees the value matches flag `id`
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  target[id] = result.data as PartialFeatures[K];
  return true;
}

/**
 * Parses an exported overrides payload into an overrides map, keeping only
 * entries that match a known flag's schema. Dropped entries are listed in
 * `warnings`.
 */
export function parseOverridesImport(content: string): OverridesImport {
  const parsed = JSON.parse(content);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid overrides file: expected a JSON object");
  }

  const overrides: PartialFeatures = {};
  const warnings: string[] = [];

  for (const [id, value] of Object.entries(parsed)) {
    if (!isFeatureId(id)) {
      warnings.push(`Ignored unknown feature flag "${id}"`);
      continue;
    }
    if (!assignOverride(overrides, id, value)) {
      warnings.push(`Ignored invalid value for "${id}"`);
    }
  }
  return { overrides, warnings };
}
