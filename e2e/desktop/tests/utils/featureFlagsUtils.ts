import { OptionalFeatureMap } from "@ledgerhq/types-live";

export const defaultFeatureFlags: OptionalFeatureMap = {
  lldModularDrawer: {
    enabled: true,
    params: {
      add_account: true,
      earn_flow: true,
      live_app: true,
      receive_flow: true,
      send_flow: true,
    },
  },
};

let _cache: OptionalFeatureMap | null = null;

/**
 * Parse FEATURE_FLAGS once, merge in defaults, cache and return the object.
 */
export function getFeatureFlags(): OptionalFeatureMap {
  if (!_cache) {
    const raw = process.env.FEATURE_FLAGS || "{}";
    const parsed = JSON.parse(raw) as OptionalFeatureMap;
    _cache = { ...defaultFeatureFlags, ...parsed };
  }
  return _cache;
}

/**
 * Convenience: is this flag both present and `.enabled === true`?
 */
export function isFeatureEnabled<Key extends keyof OptionalFeatureMap>(flag: Key): boolean {
  const flags = getFeatureFlags();
  console.log(`Checking feature flag: ${flag}`, flags[flag]);
  return Boolean(flags[flag]?.enabled);
}
