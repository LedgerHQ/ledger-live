/**
 * How a coin-module method is transmitted:
 * - `transaction`: called once per transaction the user sends, so every call is sent;
 * - `preparation`: called again on every edit of a transaction, often without a send at the end,
 *   so its successes are sampled with `preparationSampleRate`;
 * - `sync`: called per account and per sync cycle, so its successes are sampled with
 *   `syncPathSampleRate`;
 * - `off`: nothing is sent, failures included.
 */
export const COIN_MODULE_CALL_TIERS = ["transaction", "preparation", "sync", "off"] as const;

export type CoinModuleCallTier = (typeof COIN_MODULE_CALL_TIERS)[number];

export const isCoinModuleCallTier = (value: unknown): value is CoinModuleCallTier =>
  (COIN_MODULE_CALL_TIERS as readonly unknown[]).includes(value);

/**
 * Tiers by method name. Keyed by plain strings, not by the contract's method names, so the
 * coin-module contract can gain or lose a method without a change here.
 */
export type MethodTiers = Readonly<Partial<Record<string, CoinModuleCallTier>>>;

/**
 * The coin-module methods that are observed, with their tier, unless the `coinObservability` flag
 * overrides it with `methodTiers`.
 *
 * This is a whitelist, not a copy of the contract: a method it does not name is `off`, so a
 * framework release that adds a method sends nothing for it until it is listed here or given a
 * tier by the flag.
 *
 * `craftTransactionData` and `validateAddress` are `preparation`: the bridge calls them while the
 * user edits a transaction. `getNextSequence` is `sync`: the bridge calls it on every account
 * sync, and only once more at signing.
 */
export const DEFAULT_METHOD_TIERS: MethodTiers = {
  craftTransaction: "transaction",
  craftRawTransaction: "transaction",
  combine: "transaction",
  broadcast: "transaction",

  craftTransactionData: "preparation",
  estimateFees: "preparation",
  listFeeOptions: "preparation",
  validateIntent: "preparation",
  validateAddress: "preparation",

  lastBlock: "sync",
  getBalance: "sync",
  listOperations: "sync",
  getAccountInfo: "sync",
  getNextSequence: "sync",
  getBlock: "sync",
  getBlockInfo: "sync",
  getStakes: "sync",
  getRewards: "sync",
  getValidators: "sync",
  register: "sync",
  call: "sync",
};

const lookup = (tiers: MethodTiers, method: string): CoinModuleCallTier | undefined =>
  Object.prototype.hasOwnProperty.call(tiers, method) ? tiers[method] : undefined;

/** The tier of `method`: the flag's override, else the default, else `off`. */
export function tierFor(method: string, overrides: MethodTiers = {}): CoinModuleCallTier {
  return lookup(overrides, method) ?? lookup(DEFAULT_METHOD_TIERS, method) ?? "off";
}

/**
 * Keeps the entries of a remote `methodTiers` value that name a known tier. A remote config is
 * not trusted: an entry with an unknown tier is dropped, so its method keeps its default tier.
 */
export function toMethodTiers(value: unknown): MethodTiers {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, tier]) => isCoinModuleCallTier(tier)));
}
