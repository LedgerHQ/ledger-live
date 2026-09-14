import snakeCase from "lodash/snakeCase";
import { FeatureIdSchema } from "@shared/feature-flags";
import type { FeatureId, FeatureMap, PartialFeatures } from "@shared/feature-flags";

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

// Precomputed inverse of `formatToFirebaseFeatureId`.
// `lodash.camelCase(snakeCase(id))` is not a clean round-trip for FeatureIds with digits or
// consecutive uppercase letters (e.g. `web3hub` → `web_3_hub` → `web3Hub`,
// `ptxSwapReceiveTRC20WithoutTrx` → `..._trc_20_..._trx` → `ptxSwapReceiveTrc20WithoutTrx`), which
// would silently drop the flag. Inverting the forward map avoids the round-trip entirely.
const FIREBASE_KEY_TO_FEATURE_ID: Record<string, FeatureId> = Object.fromEntries(
  FeatureIdSchema.options.map(id => [formatToFirebaseFeatureId(id), id]),
);

/**
 * The shape of a Remote Config value, structurally. Satisfied by both the Firebase JS SDK's
 * `Value` and `@react-native-firebase`'s `ConfigValue`, so this module needs no SDK dependency.
 */
export interface RemoteConfigValue {
  getSource(): string;
  asString(): string;
}

/**
 * Maps a Remote Config `getAll()` payload back to canonical FeatureIds.
 *
 * Entries the SDK serves from the seeded defaults are skipped. `getAll` unions the activated
 * config with `defaultConfig`, so keeping them would record a compiled default as if the backend
 * had sent it; dropping them leaves resolution to fall back to those same defaults, and makes a
 * returned entry mean "the backend really sent this".
 *
 * Unknown keys (`config_*`, stray entries) and malformed JSON are dropped silently.
 *
 * @param all
 * The `getAll()` payload, keyed by Firebase Remote Config key.
 *
 * @returns
 * The subset that maps to a known FeatureId and came from the backend.
 */
export function parseFirebaseFeatures(all: Record<string, RemoteConfigValue>): PartialFeatures {
  const flags: PartialFeatures = {};
  for (const [key, value] of Object.entries(all)) {
    if (value.getSource() !== "remote") continue;
    // `lodash.snakeCase` always lowercases — match it on the read side so any case drift in
    // Firebase admin entries still resolves to the canonical id.
    const featureId = FIREBASE_KEY_TO_FEATURE_ID[key.toLowerCase()];
    if (!featureId) continue;
    try {
      flags[featureId] = JSON.parse(value.asString());
    } catch {
      // Malformed JSON in remote config — drop this key, fall back to default.
    }
  }
  return flags;
}
