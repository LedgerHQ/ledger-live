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
 * The tier of every method of the coin-module contract, unless the `coinObservability` flag
 * overrides it with `methodTiers`.
 *
 * Ledger Live Common checks at compile time that this table names exactly the contract's methods,
 * so a framework bump that adds a method fails the typecheck until the method is classified here.
 * A method missing at runtime falls back to `sync`, which is sampled.
 *
 * `craftTransactionData` and `validateAddress` are `preparation`: the bridge calls them while the
 * user edits a transaction. `getNextSequence` is `sync`: the bridge calls it on every account
 * sync, and only once more at signing.
 */
export const DEFAULT_METHOD_TIERS = {
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
} as const satisfies Record<string, CoinModuleCallTier>;

/** Per-method tiers sent by the `coinObservability` flag; they win over the defaults. */
export type MethodTiers = Readonly<Partial<Record<string, CoinModuleCallTier>>>;

const lookup = (tiers: MethodTiers, method: string): CoinModuleCallTier | undefined =>
  Object.prototype.hasOwnProperty.call(tiers, method) ? tiers[method] : undefined;

/** The tier of `method`: the flag's override, else the default, else `sync`. */
export function tierFor(method: string, overrides: MethodTiers = {}): CoinModuleCallTier {
  return lookup(overrides, method) ?? lookup(DEFAULT_METHOD_TIERS, method) ?? "sync";
}

/**
 * Keeps the entries of a remote `methodTiers` value that name a known tier. A remote config is
 * not trusted: an entry with an unknown tier is dropped, so its method keeps its default tier.
 */
export function toMethodTiers(value: unknown): MethodTiers {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, tier]) => isCoinModuleCallTier(tier)));
}
