import type { Balance, Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type {
  StakingDelegation,
  StakingDelegationStatus,
  StakingPositionDetails,
  StakingResources,
  StakingUnbonding,
  StakingValidatorItem,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { optionalNumeric } from "../utils";

export function hasStake(balance: Balance): balance is Balance & { stake: Stake } {
  return balance.stake !== undefined;
}

export function hasActiveStake(stake: Stake): boolean {
  return stake.state === "active" || stake.state === "activating";
}

export function hasDeactivatingStake(stake: Stake): boolean {
  // `inactive` would otherwise fall through both lists and vanish from `stakingResources`.
  return (
    stake.state === "deactivating" || stake.state === "withdrawable" || stake.state === "inactive"
  );
}

export function deriveDelegationStatus(
  stakeState: Stake["state"],
  detailStatus: unknown,
): StakingDelegationStatus {
  if (stakeState === "activating") return "activating";
  if (detailStatus === "unbonding" || detailStatus === "unbonded") return detailStatus;
  return "bonded";
}

export function stakingPositionDetails(stake: Stake): StakingPositionDetails {
  const details = stake.details ?? {};
  const activeAmount = optionalNumeric(details.activeAmount);
  const inactiveAmount = optionalNumeric(details.inactiveAmount);
  const withdrawableAmount = optionalNumeric(details.withdrawableAmount);
  const lockedReserve = optionalNumeric(details.lockedReserve);

  // `!== undefined`, not truthiness: a zero amount is meaningful.
  return {
    ...(stake.uid ? { positionId: stake.uid } : {}),
    ...(activeAmount !== undefined ? { activeAmount } : {}),
    ...(inactiveAmount !== undefined ? { inactiveAmount } : {}),
    ...(withdrawableAmount !== undefined ? { withdrawableAmount } : {}),
    ...(lockedReserve !== undefined ? { lockedReserve } : {}),
    ...(typeof details.canStake === "boolean" ? { canStake: details.canStake } : {}),
    ...(typeof details.canWithdraw === "boolean" ? { canWithdraw: details.canWithdraw } : {}),
  };
}

/**
 * On-Account shape for `stakingPositions`: framework `Stake` with `bigint`
 * amounts converted to `BigNumber`, matching the convention used elsewhere on
 * the Account (`balance`, `spendableBalance`, `stakingResources.*`).
 */
export type StakingPositionOnAccount = Omit<
  Stake,
  "amount" | "amountDeposited" | "amountRewarded"
> & {
  amount: BigNumber;
  amountDeposited?: BigNumber;
  amountRewarded?: BigNumber;
};

export function toStakingPositionOnAccount(stake: Stake): StakingPositionOnAccount {
  const { amount, amountDeposited, amountRewarded, ...rest } = stake;
  return {
    ...rest,
    amount: new BigNumber(amount.toString()),
    ...(amountDeposited !== undefined && {
      amountDeposited: new BigNumber(amountDeposited.toString()),
    }),
    ...(amountRewarded !== undefined && {
      amountRewarded: new BigNumber(amountRewarded.toString()),
    }),
  };
}

const toBigNumber = (value: bigint): BigNumber => new BigNumber(value.toString());

const sum = (values: bigint[]): bigint => values.reduce((acc, value) => acc + value, 0n);

function toDelegation(stake: Stake): StakingDelegation {
  const { validatorId, validatorName, status } = stake.details ?? {};
  // The JSON form carries `shares` as a decimal string; a bigint reads the same.
  const shares = optionalNumeric(stake.details?.shares);
  return {
    ...stakingPositionDetails(stake),
    validatorAddress: stake.delegate ?? "",
    amount: toBigNumber(stake.amount),
    pendingRewards: toBigNumber(stake.amountRewarded ?? 0n),
    status: deriveDelegationStatus(stake.state, status),
    ...(typeof validatorId === "string" ? { validatorId } : {}),
    ...(typeof validatorName === "string" ? { validatorName } : {}),
    ...(shares !== undefined ? { shares } : {}),
  };
}

function toUnbonding(stake: Stake): StakingUnbonding {
  const { validatorId, validatorName, withdrawId } = stake.details ?? {};
  return {
    ...stakingPositionDetails(stake),
    validatorAddress: stake.delegate ?? "",
    amount: toBigNumber(stake.amount),
    completionDate: stake.stateUpdatedAt ?? new Date(),
    // `inactive` also covers an idle stake, so trust `actions` rather than the state.
    status:
      stake.state === "withdrawable" || stake.actions?.includes("withdraw")
        ? "withdrawable"
        : "deactivating",
    ...(typeof validatorId === "string" ? { validatorId } : {}),
    ...(typeof validatorName === "string" ? { validatorName } : {}),
    ...(typeof withdrawId === "number" ? { withdrawId } : {}),
  };
}

export type StakingShape = {
  stakingResources?: StakingResources;
  stakingPositions?: StakingPositionOnAccount[];
  delegationsCount: number;
  unbondingsCount: number;
};

/**
 * The staking fields of an account from the stakes of its balances: one position per stake for a
 * family reporting positions (the UI groups them by uid prefix), the delegations, unbondings and
 * their totals otherwise, with the network's validators when it lists any.
 */
export function stakingShapeOf(
  stakes: Stake[],
  validators: StakingValidatorItem[],
  bridgeApi: Pick<BridgeApi, "usesStakingPositions">,
): StakingShape {
  if (bridgeApi.usesStakingPositions === true) {
    return {
      stakingPositions: stakes.map(toStakingPositionOnAccount),
      delegationsCount: 0,
      unbondingsCount: 0,
    };
  }

  const active = stakes.filter(hasActiveStake);
  const deactivating = stakes.filter(hasDeactivatingStake);
  const delegations = active.map(toDelegation);
  const unbondings = deactivating.map(toUnbonding);
  return {
    stakingResources: {
      delegations,
      redelegations: [],
      unbondings,
      delegatedBalance: toBigNumber(sum(active.map(stake => stake.amount))),
      pendingRewardsBalance: toBigNumber(sum(active.map(stake => stake.amountRewarded ?? 0n))),
      unbondingBalance: toBigNumber(sum(deactivating.map(stake => stake.amount))),
      ...(validators.length > 0 ? { validators } : {}),
    },
    delegationsCount: delegations.length,
    unbondingsCount: unbondings.length,
  };
}
