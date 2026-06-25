import { ConfigInfo, LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@ledgerhq/live-env";

/**
 * Per-chain A4 settings, keyed by currency id (e.g. "ethereum").
 *
 * - `enabled`: read balances and operations from A4 (and register the account).
 * - `registerOnly`: register the account on A4 during sync but keep reading from the
 *   local/remote coin module. Lets us warm A4 indexing before switching the data source.
 * - `endpoint`: A4 base URL for this chain (without the trailing `/{network}` segment). Falls back
 *   to the `A4_API_ENDPOINT` env when empty.
 *
 * Both `enabled` and `registerOnly` default to `false`. `registerOnly` is implied when `enabled` is
 * true (you cannot read from an account that was never registered).
 */
export type A4ChainConfig = {
  enabled?: boolean;
  registerOnly?: boolean;
  endpoint?: string;
};

export type A4Config = {
  /** Per-chain A4 settings, keyed by currency id. Chains absent from the map are A4-disabled. */
  chains: Record<string, A4ChainConfig>;
};

const A4_CONFIG_KEY = "config_generic_a4";

const DEFAULT_A4_CONFIG: A4Config = {
  chains: {},
};

/**
 * Common (cross-family) A4 config, remotely editable via Firebase. Merged into the global
 * `liveConfig` schema. Object-typed so the provider value is deep-merged over the default.
 */
export const a4Config: Record<typeof A4_CONFIG_KEY, ConfigInfo> = {
  [A4_CONFIG_KEY]: {
    type: "object",
    default: DEFAULT_A4_CONFIG,
  },
};

function getA4Config(): A4Config {
  try {
    const value = LiveConfig.getValueByKey(A4_CONFIG_KEY) as
      | Partial<A4Config>
      | undefined;
    return { ...DEFAULT_A4_CONFIG, ...value };
  } catch {
    // `getValueByKey` throws when no config has been set (e.g. some test/CLI contexts).
    // Treat that as A4 disabled rather than failing the sync.
    return DEFAULT_A4_CONFIG;
  }
}

export type ResolvedA4ChainConfig = {
  /** Read balances/operations from A4. */
  read: boolean;
  /** Register the account on A4 during sync (always true when `read` is true). */
  register: boolean;
  /** A4 base URL for this chain (without the trailing `/{network}` segment). */
  endpoint: string;
};

/** Resolve the A4 behaviour for a given chain (currency id). */
export function resolveA4ChainConfig(network: string): ResolvedA4ChainConfig {
  const chain = getA4Config().chains[network] ?? {};
  const read = chain.enabled === true;
  return {
    read,
    register: read || chain.registerOnly === true,
    endpoint: chain.endpoint || getEnv("A4_API_ENDPOINT"),
  };
}
