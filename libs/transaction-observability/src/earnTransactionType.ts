import type { StakingOperation } from "@ledgerhq/coin-module-framework/api/types";

/**
 * Normalized transaction action, for cross-flow funnel analytics.
 *
 * Written out rather than derived from `StakingOperation`: this is an analytics
 * contract, so it must widen by deliberate edit, never on a dependency bump.
 */
export type EarnTransactionType =
  // StakingOperation
  | "delegate"
  | "undelegate"
  | "redelegate"
  | "claimReward"
  | "compoundReward"
  | "withdraw"
  // EVM / vault
  | "approve"
  | "deposit"
  | "redeem";

// Fails the build if upstream StakingOperation drifts out of EarnTransactionType.
type Extends<Narrow extends Wide, Wide> = Narrow;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _StakingOperationIsCovered = Extends<StakingOperation, EarnTransactionType>;

/**
 * Family-aware: the same word differs per family (celo `vote` and tron `freeze` start
 * staking; TON `jetton-burn` is an unstake), and a flat verb list also misses Solana
 * entirely because its actions are dotted. Keys are lower-cased.
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
  // payload.type. jetton-burn (Tonstakers unstake) omitted: indistinguishable from a
  // plain jetton burn without inspecting the destination.
  ton: {
    "tonstakers-deposit": "deposit",
    "tonwhales-pool-deposit": "deposit",
    "tonwhales-pool-withdraw": "withdraw",
    "single-nominator-withdraw": "withdraw",
  },
  // Selector names are the contract's vocabulary, not actions, so only unambiguous
  // ones are mapped; swaps, bridges and the rest fall through to undefined.
  evm: {
    approve: "approve",
    // Pooled/vault staking has no validator to pick, so entry is deposit, not delegate.
    deposit: "deposit",
    mint: "deposit",
    submit: "deposit",
    stake: "deposit",
    supply: "deposit",
    // Exit counterparts of deposit — not undelegate because no validator involved.
    withdraw: "withdraw",
    unstake: "withdraw",
    requestwithdraw: "withdraw",
    requestwithdrawals: "withdraw",
    claimwithdrawals: "withdraw",
    // Share-exact exit (ERC-4626).
    redeem: "redeem",
    // Real on-chain delegation: governance and EVM-native staking chains.
    delegate: "delegate",
    undelegate: "undelegate",
    redelegate: "redelegate",
    claim: "claimReward",
    claimrewards: "claimReward",
    getreward: "claimReward",
  },
};

// wallet-api tx family is "ethereum" while the account family is "evm"; elrond is the
// currency id for the multiversx family.
const FAMILY_ALIASES: Record<string, string> = {
  ethereum: "evm",
  elrond: "multiversx",
};

/**
 * Map a family-specific raw action (family `mode`, Solana `model.kind`, TON
 * `payload.type`, or an EVM selector name) to a {@link EarnTransactionType}.
 *
 * `undefined` means "not a staking action" (plain send, swap) — a first-class
 * outcome, so callers never have to guess.
 */
export function deriveEarnTransactionType(
  family: string | undefined,
  rawTransactionType: string | undefined,
): EarnTransactionType | undefined {
  if (!family || !rawTransactionType) return undefined;
  const key = family.toLowerCase();
  const actions = FAMILY_ACTIONS[FAMILY_ALIASES[key] ?? key];
  return actions?.[rawTransactionType.toLowerCase()];
}
