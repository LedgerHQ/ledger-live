import type { OperationType } from "@ledgerhq/types-live";
import type { EarnTransactionType } from "./earnTransactionType";
import { resolveFamily } from "./earnTransactionType";

/**
 * Broadcast-stage action derivation.
 *
 * `broadcast` receives no transaction, only the optimistic `Operation`, so the action has to
 * come from its `OperationType`. That is a coarser and partly overloaded vocabulary — the
 * same word means different things per family (`WITHDRAW` is Celo's unlock-withdraw;
 * `WITHDRAW_UNBONDED` is EVM's and Polkadot's) — hence the per-family maps.
 *
 * Every entry below was read from the family's own `buildOptimisticOperation`. Generic types
 * (`OUT`, `IN`, `NONE`, `FEES`, `UNKNOWN`) are deliberately never mapped: they are what a
 * plain send produces, so claiming them would misreport ordinary transfers as staking.
 */
const FAMILY_OPERATION_TYPES: Record<
  string,
  Partial<Record<OperationType, EarnTransactionType>>
> = {
  cardano: { DELEGATE: "delegate", UNDELEGATE: "undelegate" },
  celo: {
    LOCK: "deposit",
    VOTE: "delegate",
    ACTIVATE: "delegate",
    REVOKE: "undelegate",
    UNLOCK: "undelegate",
    WITHDRAW: "withdraw",
  },
  // REWARD covers claimReward and claimRewardCompound alike — see COLLAPSES.
  cosmos: {
    DELEGATE: "delegate",
    UNDELEGATE: "undelegate",
    REDELEGATE: "redelegate",
    REWARD: "claimReward",
  },
  evm: {
    DELEGATE: "delegate",
    UNDELEGATE: "undelegate",
    REDELEGATE: "redelegate",
    WITHDRAW_UNBONDED: "withdraw",
    REWARD: "claimReward",
  },
  hedera: { DELEGATE: "delegate", UNDELEGATE: "undelegate", REDELEGATE: "redelegate" },
  multiversx: {
    DELEGATE: "delegate",
    UNDELEGATE: "undelegate",
    WITHDRAW_UNBONDED: "withdraw",
    REWARD: "claimReward",
  },
  near: { STAKE: "delegate", UNSTAKE: "undelegate", WITHDRAW_UNSTAKED: "withdraw" },
  polkadot: {
    BOND: "delegate",
    NOMINATE: "delegate",
    UNBOND: "undelegate",
    CHILL: "undelegate",
    WITHDRAW_UNBONDED: "withdraw",
    REWARD_PAYOUT: "claimReward",
  },
  solana: { DELEGATE: "delegate", UNDELEGATE: "undelegate" },
  sui: { DELEGATE: "delegate", UNDELEGATE: "undelegate" },
  tezos: {
    DELEGATE: "delegate",
    UNDELEGATE: "undelegate",
    STAKE: "delegate",
    UNSTAKE: "undelegate",
    FINALIZE_UNSTAKE: "withdraw",
  },
  tron: {
    FREEZE: "delegate",
    VOTE: "delegate",
    UNFREEZE: "undelegate",
    LEGACY_UNFREEZE: "undelegate",
    UNDELEGATE_RESOURCE: "undelegate",
    WITHDRAW_EXPIRE_UNFREEZE: "withdraw",
    REWARD: "claimReward",
  },
};

/**
 * The generic coin framework's `defaultOperationType` mapping, inverted — the fallback for a
 * family not named above.
 *
 * A family that migrates onto that framework without supplying `describeOptimisticOperation`
 * lands on exactly these types, so covering them here means such a migration is classified
 * correctly without a change to this file. Consulted after the family map, for the same
 * reason as on the sign stage.
 *
 * `OUT` / `IN` / `NONE` / `FEES` are absent here too: that is where a family with no mapping
 * lands, and claiming them would sweep ordinary transfers into the funnel.
 */
const GENERIC_OPERATION_TYPES: Partial<Record<OperationType, EarnTransactionType>> = {
  DELEGATE: "delegate",
  REDELEGATE: "redelegate",
  UNDELEGATE: "undelegate",
  STAKE: "delegate",
  UNSTAKE: "undelegate",
  FINALIZE_UNSTAKE: "withdraw",
  WITHDRAW_UNBONDED: "withdraw",
  REWARD: "claimReward",
};

/**
 * Staking actions that produce a generic `OperationType`, and so cannot be recovered at the
 * broadcast stage at all. Documented as data because the matrix test asserts it: these are
 * the flows whose success is only reportable once sign↔broadcast correlation is in place.
 */
export const UNRECOVERABLE_AT_BROADCAST: Record<string, string[]> = {
  // Crafted as a plain self-transfer that triggers the claim, so it is literally an `OUT`.
  hedera: ["claim-rewards"],
  algorand: ["claimReward"],
  // `stake.withdraw` is an `IN`, `stake.split` an `OUT`.
  solana: ["stake.withdraw", "stake.split"],
};

/**
 * Distinct sign-stage actions that share one `OperationType`, so the broadcast stage reports
 * the first of them. Asserted by the matrix test so a silent widening is caught.
 */
export const COLLAPSES: Record<string, Array<[string, string]>> = {
  cosmos: [["claimReward", "claimRewardCompound"]],
  evm: [["claimReward", "compoundReward"]],
  multiversx: [["delegate", "reDelegateRewards"]],
  polkadot: [["bond", "rebond"]],
  solana: [["stake.createAccount", "stake.delegate"]],
};

export function deriveFromOperationType(
  family: string | undefined,
  operationType: OperationType | string | undefined,
): EarnTransactionType | undefined {
  if (!family || !operationType) return undefined;
  const type = operationType as OperationType;
  return FAMILY_OPERATION_TYPES[resolveFamily(family)]?.[type] ?? GENERIC_OPERATION_TYPES[type];
}
