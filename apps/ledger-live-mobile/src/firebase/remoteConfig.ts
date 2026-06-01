import { getRemoteConfig } from "@react-native-firebase/remote-config";
import snakeCase from "lodash/snakeCase";
import { formatDefaultFeatures } from "@ledgerhq/live-common/featureFlags/index";
import { FEATURE_FLAGS_DEFAULTS, FeatureIdSchema } from "@shared/feature-flags";
import type { FeatureId, PartialFeatures } from "@shared/feature-flags";

type Subscriber = (event: { fetchedAt: number }) => void;

const rc = getRemoteConfig();

let setupPromise: Promise<void> | null = null;
let lastFetchedAt: number | null = null;
const subscribers = new Set<Subscriber>();

let resolveReady: (() => void) | null = null;
const readyPromise: Promise<void> = new Promise(resolve => {
  resolveReady = resolve;
});

/**
 * One-shot setup: applies `minimumFetchIntervalMillis: 0` and seeds defaults
 * from {@link FEATURE_FLAGS_DEFAULTS}. Awaited at the start of every
 * {@link fetchRemoteFlags} so the first fetch always honors defaults even when
 * the middleware fires immediately at store creation.
 */
function setup(): Promise<void> {
  if (!setupPromise) {
    setupPromise = Promise.all([
      rc.setConfigSettings({ minimumFetchIntervalMillis: 0 }),
      rc.setDefaults(formatDefaultFeatures(FEATURE_FLAGS_DEFAULTS)),
    ]).then(() => undefined);
  }
  return setupPromise;
}

/**
 * Subscribe to successful remote-flag fetches. The callback fires after each
 * successful {@link fetchRemoteFlags} call with the wall-clock timestamp. Used
 * by callers that already gate boot on the legacy RTK Query (`firebaseRemoteConfigApi`)
 * so Context/Redux consumers stay in lockstep.
 *
 * If a fetch has already succeeded by the time of subscription, the callback
 * fires synchronously with the last known timestamp so late subscribers don't
 * miss the boot-time fetch dispatched by the middleware.
 *
 * @returns An unsubscribe function.
 */
export function subscribeToRemoteFlags(callback: Subscriber): () => void {
  subscribers.add(callback);
  if (lastFetchedAt !== null) {
    callback({ fetchedAt: lastFetchedAt });
  }
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Resolves on the first {@link fetchRemoteFlags} completion (success or failure)
 * so callers can gate app boot on Firebase having had a chance to respond.
 */
export function whenReady(): Promise<void> {
  return readyPromise;
}

/**
 * Reverse lookup from the Firebase remote-config key (snake_case after the
 * `feature_` prefix) to the canonical registered FeatureId. Built once from
 * `FeatureIdSchema.options` so it always matches the legacy
 * `formatToFirebaseFeatureId(id) = "feature_" + snakeCase(id)` mapping.
 *
 * Why this exists: naïvely inverting with `camelCase(rcKey)` does not
 * round-trip for IDs containing acronyms — `snakeCase("llmAccountListUI")` is
 * `"llm_account_list_ui"` but `camelCase("llm_account_list_ui")` is
 * `"llmAccountListUi"` (lowercase `i`), which does not match the registered
 * `llmAccountListUI`. Going id→snake (the same direction the legacy resolver
 * used to look the flag up) is unambiguous and acronym-safe.
 */
const featureIdByRcKey: Map<string, FeatureId> = new Map(
  FeatureIdSchema.options.map(id => [snakeCase(id), id]),
);

/**
 * Single source of truth for fetching Firebase remote feature flags. Wired into
 * `createFeatureFlagsMiddleware` so the Redux slice's `state.featureFlags.remote`
 * stays in sync, and exposed via {@link subscribeToRemoteFlags} so legacy
 * consumers hydrate from the same payload at the same tick.
 *
 * Filters out `config_*` keys (owned by `LiveConfig`), strips the `feature_`
 * prefix, resolves the canonical FeatureId via {@link featureIdByRcKey}, and
 * JSON-parses each value. Malformed JSON values are dropped silently — at
 * worst the slice falls back to defaults for that key. Unknown feature keys
 * (no matching registered ID) are dropped, so the closing cast to
 * {@link PartialFeatures} is safe.
 */
export async function fetchRemoteFlags(): Promise<PartialFeatures> {
  try {
    await setup();
    await rc.fetchAndActivate();
    const all = rc.getAll();
    const flags: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(all)) {
      if (!key.startsWith("feature_")) continue;
      const featureId = featureIdByRcKey.get(key.slice("feature_".length));
      if (!featureId) continue;
      try {
        flags[featureId] = JSON.parse(value.asString());
      } catch {
        // Malformed JSON in remote config — drop this key, fall back to default.
      }
    }
    const fetchedAt = Date.now();
    lastFetchedAt = fetchedAt;
    subscribers.forEach(callback => callback({ fetchedAt }));
    return flags as PartialFeatures;
  } finally {
    resolveReady?.();
    resolveReady = null;
  }
}
