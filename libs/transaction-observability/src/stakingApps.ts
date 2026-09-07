/**
 * How a provider stakes. Matches the Earn API's `category`, except that its `protocol`
 * is reported as `dedicated` — the word the API itself uses in `queryParams.focus`.
 */
export type StakingMethod = "liquid" | "pooling" | "restaking" | "dedicated";

/**
 * The live-apps and dApps whose transactions belong in the earn funnel, and how each stakes.
 *
 * A manifest id is the only reliable signal that a contract call is staking. Call data cannot
 * decide it: a selector is the keccak hash of a function signature, so `0xd0e30db0` is
 * `deposit()` on WETH — wrapping ETH — as readily as it is a vault entry. Gating on the app the
 * user opened keeps swaps, bridges and NFT mints out of `earn_transaction_*`.
 *
 * Ethereum is the whole list today: the Earn API returns providers for no other currency.
 *
 * `undefined` means the app stakes more than one way and the manifest cannot say which.
 * `kiln-staking` serves both a pooled and a dedicated product, separated only by a
 * `queryParams.focus` the bridge never sees, so its method comes from the contract instead.
 *
 * Kept in code rather than fetched: this gates emission, and a gate must not depend on a
 * network call. `stakingApps.integration.test.ts` fails when the API gains an active app that
 * is missing here.
 */
const STAKING_LIVE_APPS: Record<string, StakingMethod | undefined> = {
  lido: "liquid",
  "stader-eth": "liquid",
  chorusone: "pooling",
  "coinbase-staking": "pooling",
  "kelp-dao": "restaking",
  figment: "dedicated",
  p2p: "dedicated",
  // Pooled and dedicated share this manifest — see the docblock above.
  "kiln-staking": undefined,
};

// Own keys only. `in` and a bare index also answer for `toString` and `constructor`, which
// would open the gate for a manifest of that name and report a function as the method.
function entry(manifestId: string | undefined): StakingMethod | undefined | null {
  if (manifestId === undefined) return null;
  return Object.prototype.hasOwnProperty.call(STAKING_LIVE_APPS, manifestId)
    ? STAKING_LIVE_APPS[manifestId]
    : null;
}

/** Whether a manifest's transactions belong in the earn funnel. */
export function isStakingApp(manifestId: string | undefined): boolean {
  return entry(manifestId) !== null;
}

/** How the app stakes, when its manifest alone is enough to say. */
export function stakingMethodOf(manifestId: string | undefined): StakingMethod | undefined {
  return entry(manifestId) ?? undefined;
}

/** The manifest ids this package knows about — read by the drift guard. */
export function knownStakingApps(): string[] {
  return Object.keys(STAKING_LIVE_APPS);
}
