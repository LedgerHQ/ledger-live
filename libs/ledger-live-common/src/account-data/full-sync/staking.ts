import type BigNumber from "bignumber.js";
import type { Stake } from "@ledgerhq/coin-module-framework/api/index";
import {
  isStakingAccount,
  type Account,
  type StakingDelegation,
  type StakingAccount,
  type StakingRedelegation,
  type StakingUnbonding,
} from "@ledgerhq/types-live";
import { AccountStakingSchema, type AccountStaking } from "@domain/entity-account-staking";
import { loadStakingForFamily } from "../../coin-modules/registry";
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

/** Per destination validator, the pending redelegation completing last: until then the delegation cannot be redelegated. */
function latestRedelegations(redelegations: StakingRedelegation[]) {
  const latest = new Map<string, StakingRedelegation>();
  for (const redelegation of redelegations) {
    const known = latest.get(redelegation.validatorDstAddress);
    if (!known || known.completionDate < redelegation.completionDate) {
      latest.set(redelegation.validatorDstAddress, redelegation);
    }
  }
  return latest;
}

const fromDelegation = (
  assetId: string,
  { positionId, validatorAddress, status, amount, pendingRewards }: StakingDelegation,
  index: number,
  redelegation: StakingRedelegation | undefined,
) => ({
  id: "delegation:" + (positionId ?? `${validatorAddress}:${index}`),
  assetId,
  validatorId: validatorAddress || undefined,
  // The status is the validator's bond state: the delegation itself stays staked.
  state: status === "activating" ? "activating" : "active",
  amount: toAmount(amount),
  rewards: toAmount(pendingRewards),
  redelegatingFrom: redelegation && {
    validatorId: redelegation.validatorSrcAddress,
    completesAt: redelegation.completionDate.toISOString(),
  },
});

const fromUnbonding = (
  assetId: string,
  { positionId, validatorAddress, status, amount, completionDate }: StakingUnbonding,
  index: number,
) => ({
  id: "unbonding:" + (positionId ?? `${validatorAddress}:${completionDate.getTime()}:${index}`),
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

const fromResources = ({ currency, stakingResources }: StakingAccount) => {
  const redelegations = latestRedelegations(stakingResources.redelegations);
  return [
    ...stakingResources.delegations.map((d, i) =>
      fromDelegation(currency.id, d, i, redelegations.get(d.validatorAddress)),
    ),
    ...stakingResources.unbondings.map((u, i) => fromUnbonding(currency.id, u, i)),
  ];
};

/** The `staking` kind of a synced account: `stakingResources`, `stakingPositions`, then the family's own resources. */
export async function toAccountStaking(account: Account): Promise<AccountStaking> {
  const assetId = account.currency.id;
  // A redelegation is not a position: the moved stake is already a delegation to its destination.
  const resources = isStakingAccount(account) ? fromResources(account) : [];
  // Every family keeping positions stakes its native coin only.
  const stakes = hasStakingPositions(account)
    ? account.stakingPositions
        .filter(({ asset }) => asset === undefined || asset.type === "native")
        .map(position => fromStake(assetId, position))
    : [];
  const familyStaking = (await loadStakingForFamily(account.currency.family))?.(account);
  return AccountStakingSchema.parse({
    positions: [...resources, ...stakes, ...(familyStaking?.positions ?? [])],
    rewards: familyStaking?.rewards,
  });
}
