import type { Account, AccountRaw } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type {
  StacksAccount,
  StacksAccountRaw,
  StakingPosition,
  StakingPositionRaw,
} from "../types";

export function toStakingPositionRaw(position: StakingPosition): StakingPositionRaw {
  const { amount, amountDeposited, amountRewarded, stateUpdatedAt, createdAt, ...rest } = position;
  return {
    ...rest,
    amount: amount.toFixed(),
    ...(amountDeposited !== undefined && { amountDeposited: amountDeposited.toFixed() }),
    ...(amountRewarded !== undefined && { amountRewarded: amountRewarded.toFixed() }),
    ...(stateUpdatedAt !== undefined && { stateUpdatedAt: stateUpdatedAt.toISOString() }),
    ...(createdAt !== undefined && { createdAt: createdAt.toISOString() }),
  };
}

export function fromStakingPositionRaw(raw: StakingPositionRaw): StakingPosition {
  const { amount, amountDeposited, amountRewarded, stateUpdatedAt, createdAt, ...rest } = raw;
  return {
    ...rest,
    amount: new BigNumber(amount),
    ...(amountDeposited !== undefined && { amountDeposited: new BigNumber(amountDeposited) }),
    ...(amountRewarded !== undefined && { amountRewarded: new BigNumber(amountRewarded) }),
    ...(stateUpdatedAt !== undefined && { stateUpdatedAt: new Date(stateUpdatedAt) }),
    ...(createdAt !== undefined && { createdAt: new Date(createdAt) }),
  };
}

/**
 * The classic bridge's account serializer only keeps the common `Account` fields, so without these
 * hooks `stakingPositions` is dropped on persist and the last-known position (which sync relies on
 * when the stake lookup fails) is lost on restart. An empty array is persisted as-is (it means "no
 * stake"); an absent key stays absent (it means "unknown", never fetched).
 */
export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const positions = (account as StacksAccount).stakingPositions;
  if (positions) {
    (accountRaw as StacksAccountRaw).stakingPositions = positions.map(toStakingPositionRaw);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  const raw = (accountRaw as StacksAccountRaw).stakingPositions;
  if (raw) {
    (account as StacksAccount).stakingPositions = raw.map(fromStakingPositionRaw);
  }
}
