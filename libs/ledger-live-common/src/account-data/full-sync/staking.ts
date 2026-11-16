import type BigNumber from "bignumber.js";
import type { Stake } from "@ledgerhq/coin-module-framework/api/index";
import {
  isStakingAccount,
  type Account,
  type StakingDelegation,
  type StakingUnbonding,
} from "@ledgerhq/types-live";
import { AccountStakingSchema, type AccountStaking } from "@domain/entity-account-staking";
import { toAmount } from "./balance";

/** `Stake` with `BigNumber` amounts, as the generic bridge keeps it on the account; persisted without `actions` nor `asset` on some families. */
type StakingPositionOnAccount = Pick<Stake, "uid" | "delegate" | "state"> &
  Partial<Pick<Stake, "actions" | "asset">> & {
    amount: BigNumber;
    amountDeposited?: BigNumber;
    amountRewarded?: BigNumber;
  };

const hasStakingPositions = (
  account: Account,
): account is Account & { stakingPositions: StakingPositionOnAccount[] } =>
  "stakingPositions" in account && Array.isArray(account.stakingPositions);

const optionalAmount = (value: BigNumber | undefined) =>
  value === undefined ? undefined : toAmount(value);

const fromDelegation = (
  assetId: string,
  { positionId, validatorAddress, status, amount, pendingRewards }: StakingDelegation,
  index: number,
) => ({
  id: `delegation:${positionId ?? `${validatorAddress}:${index}`}`,
  assetId,
  validatorId: validatorAddress || undefined,
  // The status is the validator's bond state: the delegation itself stays staked.
  state: status === "activating" ? "activating" : "active",
  amount: toAmount(amount),
  rewards: toAmount(pendingRewards),
});

const fromUnbonding = (
  assetId: string,
  { positionId, validatorAddress, status, amount, completionDate }: StakingUnbonding,
  index: number,
) => ({
  id: `unbonding:${positionId ?? `${validatorAddress}:${completionDate.getTime()}:${index}`}`,
  assetId,
  validatorId: validatorAddress || undefined,
  state: status ?? "deactivating",
  amount: toAmount(amount),
  unlockAt: completionDate.toISOString(),
});

const fromStake = (
  assetId: string,
  {
    uid,
    delegate,
    state,
    actions,
    amount,
    amountDeposited,
    amountRewarded,
  }: StakingPositionOnAccount,
) => ({
  id: uid,
  assetId,
  validatorId: delegate || undefined,
  state,
  amount: toAmount(amount),
  deposited: optionalAmount(amountDeposited),
  rewards: optionalAmount(amountRewarded),
  actions,
});

/** The `staking` kind of a synced account: `stakingResources` or `stakingPositions`; family resources are not mapped yet. */
export function toAccountStaking(account: Account): AccountStaking {
  const assetId = account.currency.id;
  // Redelegations are left out: the moved stake is already a delegation to the new validator.
  const resources = isStakingAccount(account)
    ? [
        ...account.stakingResources.delegations.map((d, i) => fromDelegation(assetId, d, i)),
        ...account.stakingResources.unbondings.map((u, i) => fromUnbonding(assetId, u, i)),
      ]
    : [];
  // Every family keeping positions stakes its native coin only.
  const stakes = hasStakingPositions(account)
    ? account.stakingPositions
        .filter(({ asset }) => asset === undefined || asset.type === "native")
        .map(position => fromStake(assetId, position))
    : [];
  return AccountStakingSchema.parse({ positions: [...resources, ...stakes] });
}
