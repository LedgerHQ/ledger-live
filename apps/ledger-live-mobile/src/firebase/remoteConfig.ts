import { getRemoteConfig } from "@react-native-firebase/remote-config";
import camelCase from "lodash/camelCase";
import { DEFAULT_FEATURES, formatDefaultFeatures } from "@ledgerhq/live-common/featureFlags/index";
import type { PartialFeatures } from "@shared/feature-flags";

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
 * from {@link DEFAULT_FEATURES}. Awaited at the start of every
 * {@link fetchRemoteFlags} so the first fetch always honors defaults even when
 * the middleware fires immediately at store creation.
 */
function setup(): Promise<void> {
  if (!setupPromise) {
    setupPromise = Promise.all([
      rc.setConfigSettings({ minimumFetchIntervalMillis: 0 }),
      rc.setDefaults(formatDefaultFeatures(DEFAULT_FEATURES)),
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
 * Single source of truth for fetching Firebase remote feature flags. Wired into
 * `createFeatureFlagsMiddleware` so the Redux slice's `state.featureFlags.remote`
 * stays in sync, and exposed via {@link subscribeToRemoteFlags} so legacy
 * consumers hydrate from the same payload at the same tick.
 *
 * Filters out `config_*` keys (owned by `LiveConfig`), strips the `feature_`
 * prefix, camelCases the remainder, and JSON-parses each value. Malformed JSON
 * values are dropped silently — at worst the slice falls back to defaults for
 * that key. Unknown feature IDs are dropped at runtime inside `resolveAll`, so
 * the closing cast to {@link PartialFeatures} is safe.
 */
export async function fetchRemoteFlags(): Promise<PartialFeatures> {
  try {
    await setup();
    await rc.fetchAndActivate();
    const all = rc.getAll();
    const flags: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(all)) {
      if (!key.startsWith("feature_")) continue;
      const featureId = camelCase(key.slice("feature_".length));
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
