import { getRemoteConfig } from "@react-native-firebase/remote-config";
import snakeCase from "lodash/snakeCase";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { FirebaseRemoteConfigProvider } from "@ledgerhq/live-config/providers/index";
import { formatDefaultFeatures } from "@features/platform-feature-flags";
import { FEATURE_FLAGS_DEFAULTS, FeatureIdSchema } from "@shared/feature-flags";
import type { FeatureId, PartialFeatures } from "@shared/feature-flags";

// Precomputed inverse of @features/platform-feature-flags' `formatToFirebaseFeatureId`
// (`feature_${snakeCase(id)}`).
// `lodash.camelCase(snakeCase(id))` is not a clean round-trip for FeatureIds with digits
// or consecutive uppercase letters (e.g. `llmAccountListUI` → `llm_account_list_ui` →
// `llmAccountListUi`), which silently drops the flag at the slice boundary.
const FIREBASE_KEY_TO_FEATURE_ID: Record<string, FeatureId> = Object.fromEntries(
  FeatureIdSchema.options.map(id => [`feature_${snakeCase(id)}`, id]),
);

type Subscriber = (event: { fetchedAt: number }) => void;

const rc = getRemoteConfig();

// `LiveConfig` serves non-feature `config_*` keys (countervalues, app version) absent from
// the Redux slice. Install at module init (store creation) so they resolve before first read.
LiveConfig.setProvider(
  new FirebaseRemoteConfigProvider({
    getValue: (key: string) => rc.getValue(key),
  }),
);

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
 * Single source of truth for fetching Firebase remote feature flags. Wired into
 * `createFeatureFlagsMiddleware` so the Redux slice's `state.featureFlags.remote`
 * stays in sync, and exposed via {@link subscribeToRemoteFlags} so legacy
 * consumers hydrate from the same payload at the same tick.
 *
 * Maps each known Firebase key (`feature_${snakeCase(id)}`) back to its canonical
 * FeatureId via {@link FIREBASE_KEY_TO_FEATURE_ID}, then JSON-parses each value.
 * Unknown keys (`config_*`, stray entries) and malformed JSON are dropped
 * silently — at worst the slice falls back to defaults for that flag.
 */
export async function fetchRemoteFlags(): Promise<PartialFeatures> {
  try {
    await setup();
    await rc.fetchAndActivate();
    const all = rc.getAll();
    const flags: PartialFeatures = {};
    for (const [key, value] of Object.entries(all)) {
      // `lodash.snakeCase` always lowercases — match it on the read side so any
      // case drift in Firebase admin entries still resolves to the canonical id.
      const featureId = FIREBASE_KEY_TO_FEATURE_ID[key.toLowerCase()];
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
    return flags;
  } finally {
    resolveReady?.();
    resolveReady = null;
  }
}
