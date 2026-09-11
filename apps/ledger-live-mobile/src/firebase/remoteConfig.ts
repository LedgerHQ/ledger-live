import { getRemoteConfig } from "@react-native-firebase/remote-config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { FirebaseRemoteConfigProvider } from "@ledgerhq/live-config/providers/index";
import { formatDefaultFeatures } from "@features/platform-feature-flags";
import { parseFirebaseFeatures } from "@features/platform-feature-flags/firebase";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import type { PartialFeatures } from "@shared/feature-flags";

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

/**
 * One-shot setup: applies `minimumFetchIntervalMillis: 0` and seeds defaults
 * from {@link FEATURE_FLAGS_DEFAULTS}. Awaited at the start of every
 * {@link fetchRemoteFlags} so the first fetch always honors defaults even when
 * the middleware fires immediately at store creation.
 *
 * Also the barrier {@link readCachedFlags} relies on: both calls resolve with native
 * constants, which is what hydrates the JS-side value map from the activated config the
 * platform SDK holds on disk.
 *
 * One-shot on success only. A rejected promise left in the memo would be handed to every
 * later caller, so a single transient native error would keep both readers off the SDK for
 * the rest of the session. Both calls are idempotent, so dropping the memo lets the next one
 * retry. The pre-migration setup latched the same way, through `skip: !initResult.isSuccess`
 * on a mutation fired once, but it cost only freshness back then: reads still went through
 * the SDK and its on-disk config.
 */
function setup(): Promise<void> {
  if (!setupPromise) {
    const pending = Promise.all([
      rc.setConfigSettings({ minimumFetchIntervalMillis: 0 }),
      rc.setDefaults(formatDefaultFeatures(FEATURE_FLAGS_DEFAULTS)),
    ]).then(() => undefined);
    setupPromise = pending;
    pending.catch(() => {
      if (setupPromise === pending) setupPromise = null;
    });
  }
  return setupPromise;
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
 * Deliberately awaits {@link setup} rather than `rc.ensureInitialized()`: on Android the
 * latter performs a blocking `fetchAndActivate` internally, which would put this read back on
 * the network and defeat the point. `setup` is enough, both of its calls return native
 * constants and hydrate the JS-side value map from disk.
 *
 * Never throws: an unreadable cache is not an error, it just means there is nothing to prime
 * from, so the caller falls through to the network.
 */
export async function readCachedFlags(): Promise<PartialFeatures> {
  try {
    await setup();
    return parseFirebaseFeatures(rc.getAll());
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
  await setup();
  await rc.fetchAndActivate();
  const flags = parseFirebaseFeatures(rc.getAll());
  const fetchedAt = Date.now();
  lastFetchedAt = fetchedAt;
  subscribers.forEach(callback => callback({ fetchedAt }));
  return flags;
}
