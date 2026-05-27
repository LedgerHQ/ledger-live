import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getRemoteConfig,
  fetchAndActivate,
  getAll,
  RemoteConfig,
} from "firebase/remote-config";
import camelCase from "lodash/camelCase";
import { formatDefaultFeatures } from "@ledgerhq/live-common/featureFlags/index";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import type { PartialFeatures } from "@shared/feature-flags";
import { getFirebaseConfig } from "~/firebase-setup";

type Subscriber = (event: { fetchedAt: number }) => void;

let app: FirebaseApp | null = null;
let remoteConfig: RemoteConfig | null = null;
let setupDone = false;
let lastFetchedAt: number | null = null;
const subscribers = new Set<Subscriber>();

let resolveReady: (() => void) | null = null;
const readyPromise: Promise<void> = new Promise(resolve => {
  resolveReady = resolve;
});

function getApp(): FirebaseApp {
  if (!app) app = initializeApp(getFirebaseConfig());
  return app;
}

/**
 * Lazy singleton accessor for the Firebase RemoteConfig instance. On first call,
 * applies the same settings as the legacy provider: zero fetch-interval cache
 * window and default values seeded from {@link FEATURE_FLAGS_DEFAULTS}.
 */
export function getRemoteConfigSingleton(): RemoteConfig {
  if (!remoteConfig) {
    remoteConfig = getRemoteConfig(getApp());
  }
  if (!setupDone) {
    remoteConfig.settings.minimumFetchIntervalMillis = 0;
    remoteConfig.defaultConfig = { ...formatDefaultFeatures(FEATURE_FLAGS_DEFAULTS) };
    setupDone = true;
  }
  return remoteConfig;
}

/**
 * Subscribe to successful remote-flag fetches. The callback fires after each
 * successful {@link fetchRemoteFlags} call with the wall-clock timestamp. Used
 * by the legacy `FirebaseRemoteConfigProvider` to bump `lastFetchTime` so
 * Context consumers re-render in lockstep with the Redux slice.
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
 * Mirrors the legacy provider's `loaded` flag, which flipped true in a `finally`
 * block regardless of fetch outcome.
 */
export function whenReady(): Promise<void> {
  return readyPromise;
}

/**
 * Single source of truth for fetching Firebase remote feature flags. Wired into
 * `createFeatureFlagsMiddleware` so the Redux slice's `state.featureFlags.remote`
 * stays in sync, and exposed via {@link subscribeToRemoteFlags} so the legacy
 * Context provider hydrates from the same payload at the same tick.
 *
 * Filters out `config_*` keys (owned by `LiveConfig`), strips the `feature_`
 * prefix, camelCases the remainder, and JSON-parses each value. Malformed JSON
 * values are dropped silently — at worst the slice falls back to defaults for
 * that key. Unknown feature IDs are dropped at runtime inside `resolveAll`, so
 * the closing cast to {@link PartialFeatures} is safe.
 */
export async function fetchRemoteFlags(): Promise<PartialFeatures> {
  try {
    const rc = getRemoteConfigSingleton();
    await fetchAndActivate(rc);
    const all = getAll(rc);
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
