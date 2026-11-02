import {
  activate,
  fetchAndActivate,
  getAll,
  getRemoteConfig,
  getValue,
} from "@react-native-firebase/remote-config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { FirebaseRemoteConfigProvider } from "@ledgerhq/live-config/providers/index";
import {
  formatDefaultFeatures,
  parseFirebaseFeatures,
} from "@features/platform-feature-flags-firebase";
import { setContentAbTestCopy } from "@features/platform-content-ab-tests";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import type { PartialFeatures } from "@shared/feature-flags";

type Subscriber = (event: { fetchedAt: number }) => void;

const rc = getRemoteConfig();

// `LiveConfig` serves non-feature `config_*` keys (countervalues, app version) absent from
// the Redux slice. Install at module init (store creation) so they resolve before first read.
LiveConfig.setProvider(
  new FirebaseRemoteConfigProvider({
    getValue: (key: string) => getValue(rc, key),
  }),
);

let configured = false;
let lastFetchedAt: number | null = null;
const subscribers = new Set<Subscriber>();

// RNFB queues these setters natively; `activate` and `fetchAndActivate` both wait for that queue.
// RNFB drops their promises, so a native setter failure is an unhandled rejection, not retried.
function configure(): void {
  if (configured) return;
  rc.settings = {
    fetchTimeoutMillis: rc.settings.fetchTimeoutMillis,
    minimumFetchIntervalMillis: 0,
  };
  rc.defaultConfig = formatDefaultFeatures(FEATURE_FLAGS_DEFAULTS);
  configured = true;
}

/**
 * Subscribe to successful remote-flag fetches. The callback fires after each
 * successful {@link fetchRemoteFlags} call with the wall-clock timestamp, so consumers
 * outside the Redux slice stay in lockstep with it.
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
 * Reads the config the platform SDK activated in an earlier session and kept on disk, with no
 * network access. Wired into `createFeatureFlagsMiddleware` as `readCachedFlags` so boot
 * resolves on the last values the backend actually sent instead of on compiled defaults.
 *
 * Awaits `activate(rc)`, not `ensureInitialized(rc)`, which fetches over the network on Android.
 * It also applies a config fetched but left unactivated by a session that died mid-fetch.
 *
 * Never throws: an unreadable cache is not an error, it just means there is nothing to prime
 * from, so the caller falls through to the network.
 */
export async function readCachedFlags(): Promise<PartialFeatures> {
  try {
    configure();
    await activate(rc).catch(error => {
      console.warn(
        "Remote config activate failed, reading the value map hydrated from disk",
        error,
      );
    });
    return hydrateRemoteConfigValues(getAll(rc));
  } catch {
    return {};
  }
}

/**
 * Single source of truth for fetching Firebase remote feature flags. Wired into
 * `createFeatureFlagsMiddleware` so the Redux slice's `state.featureFlags.remote`
 * stays in sync, and exposed via {@link subscribeToRemoteFlags} so other
 * consumers hydrate from the same payload at the same tick.
 *
 * Rethrows on a failed fetch. The middleware swallows it, and {@link readCachedFlags} has
 * already served whatever this device knew.
 */
export async function fetchRemoteFlags(): Promise<PartialFeatures> {
  configure();
  await fetchAndActivate(rc);
  const flags = hydrateRemoteConfigValues(getAll(rc));
  const fetchedAt = Date.now();
  lastFetchedAt = fetchedAt;
  subscribers.forEach(callback => callback({ fetchedAt }));
  return flags;
}

// One `getAll()` payload, two readers: the flag decoder and the copy experiments,
// which are `feature_copy_*` keys in the same Remote Config template.
function hydrateRemoteConfigValues(all: ReturnType<typeof getAll>): PartialFeatures {
  setContentAbTestCopy(all);
  return parseFirebaseFeatures(all);
}
