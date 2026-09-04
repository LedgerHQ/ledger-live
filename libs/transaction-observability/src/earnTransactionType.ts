import type { StakingOperation } from "@ledgerhq/coin-module-framework/api/types";

/**
 * Normalized staking action, for cross-flow funnel analytics.
 *
 * Written out rather than derived from `StakingOperation`: this is an analytics contract, so
 * it must widen by deliberate edit, never on a dependency bump. `approve` and `redeem` are
 * deliberately absent until the dApp/live-app parts land; `deposit` is already needed natively,
 * because Celo splits staking into a lock leg and a vote leg.
 */
export type EarnTransactionType =
  // StakingOperation
  | "delegate"
  | "undelegate"
  | "redelegate"
  | "claimReward"
  | "compoundReward"
  | "withdraw"
  | "deposit";

// Fails the build if upstream StakingOperation drifts out of EarnTransactionType.
type Extends<Narrow extends Wide, Wide> = Narrow;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _StakingOperationIsCovered = Extends<StakingOperation, EarnTransactionType>;

/**
 * Family-aware, because the same word means different things per family: Celo `vote` and
 * Tron `freeze` both start staking, and a flat verb list misses Solana entirely since its
 * actions are dotted. Keys are lower-cased.
 */
const FAMILY_ACTIONS: Record<string, Record<string, EarnTransactionType>> = {
  // model.kind
  solana: {
    "stake.createaccount": "delegate",
    // First delegation vs re-delegation needs prior account state, absent from the tx.
    "stake.delegate": "delegate",
    "stake.undelegate": "undelegate",
    "stake.withdraw": "withdraw",
    // Split = partial unstake.
    "stake.split": "undelegate",
  },
  // mode — shared by every cosmos-SDK currency (osmo, dydx, injective, axelar, …)
  cosmos: {
    delegate: "delegate",
    undelegate: "undelegate",
    redelegate: "redelegate",
    claimreward: "claimReward",
    claimrewardcompound: "compoundReward",
  },
  cardano: { delegate: "delegate", undelegate: "undelegate" },
  polkadot: {
    bond: "delegate",
    nominate: "delegate",
    unbond: "undelegate",
    // Stops nominating without unbonding.
    chill: "undelegate",
    rebond: "redelegate",
    withdrawunbonded: "withdraw",
    claimreward: "claimReward",
  },
  tezos: {
    delegate: "delegate",
    stake: "delegate",
    undelegate: "undelegate",
    unstake: "undelegate",
    finalize_unstake: "withdraw",
  },
  near: { stake: "delegate", unstake: "undelegate", withdraw: "withdraw" },
  multiversx: {
    delegate: "delegate",
    undelegate: "undelegate",
    redelegaterewards: "compoundReward",
    claimrewards: "claimReward",
    withdraw: "withdraw",
  },
  // Celo splits staking across two txs (lock + vote), so one tx is only ever one leg.
  celo: {
    lock: "deposit",
    vote: "delegate",
    activate: "delegate",
    revoke: "undelegate",
    unlock: "undelegate",
    withdraw: "withdraw",
  },
  // Tron likewise splits freeze + vote.
  tron: {
    freeze: "delegate",
    vote: "delegate",
    unfreeze: "undelegate",
    // The pre-Stake2.0 unfreeze, still reachable on old frozen balances.
    legacyunfreeze: "undelegate",
    undelegateresource: "undelegate",
    claimreward: "claimReward",
    withdrawexpireunfreeze: "withdraw",
  },
  hedera: {
    delegate: "delegate",
    undelegate: "undelegate",
    redelegate: "redelegate",
    "claim-rewards": "claimReward",
  },
  // optIn is an asset opt-in, not staking.
  algorand: { claimreward: "claimReward" },
  sui: { delegate: "delegate", undelegate: "undelegate" },
  aptos: {
    stake: "delegate",
    restake: "redelegate",
    unstake: "undelegate",
    withdraw: "withdraw",
  },
  /**
   * EVM native staking (sei_evm, monad, somnia, zero_gravity) is a precompile call, but the
   * transaction still carries a `mode` from GENERIC_TRANSACTION_MODE — the flows set it
   * alongside `valAddress`. So no call-data parsing is needed here; the dApp selector route
   * belongs to the partner work.
   */
  evm: {
    delegate: "delegate",
    redelegate: "redelegate",
    undelegate: "undelegate",
    stake: "delegate",
    unstake: "undelegate",
    withdraw: "withdraw",
    claimreward: "claimReward",
    compoundreward: "compoundReward",
  },
};

/**
 * The generic coin framework's own vocabulary (`GENERIC_TRANSACTION_MODE`), used as a
 * fallback for any family not named above.
 *
 * Families migrating onto that framework keep their own words where they have them — tron
 * still says `freeze`/`vote`, and its hooks are typed `mode: string`, not the generic union —
 * so this is a safety net, not a replacement. It means a family that migrates and adopts the
 * generic words is classified correctly with no change here.
 *
 * Consulted *after* the family map, never before: where a family defines a word that also
 * exists generically, the family's meaning is the authoritative one.
 */
const GENERIC_ACTIONS: Record<string, EarnTransactionType> = {
  delegate: "delegate",
  redelegate: "redelegate",
  undelegate: "undelegate",
  stake: "delegate",
  unstake: "undelegate",
  finalize_unstake: "withdraw",
  withdraw: "withdraw",
  claimreward: "claimReward",
  compoundreward: "compoundReward",
};

// The wallet-api tx family is "ethereum" while the account family is "evm"; elrond is the
// currency id for the multiversx family.
const FAMILY_ALIASES: Record<string, string> = {
  ethereum: "evm",
  elrond: "multiversx",
};

const resolveFamily = (family: string): string => {
  const key = family.toLowerCase();
  return FAMILY_ALIASES[key] ?? key;
};

/**
 * Map a family-specific raw action (a family `mode` or Solana `model.kind`) to an
 * {@link EarnTransactionType}.
 *
 * `undefined` means "not a staking action" (plain send, swap) — a first-class outcome, so
 * callers never have to guess.
 */
export function deriveEarnTransactionType(
  family: string | undefined,
  rawTransactionType: string | undefined,
): EarnTransactionType | undefined {
  if (!family || !rawTransactionType) return undefined;
  const action = rawTransactionType.toLowerCase();
  return FAMILY_ACTIONS[resolveFamily(family)]?.[action] ?? GENERIC_ACTIONS[action];
}

export { resolveFamily };
