import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import {
  AccountStakingPositionSchema,
  type AccountStakingPosition,
} from "@domain/entity-account-staking";
import type { PolkadotAccount } from "./types";

const isPolkadotAccount = (account: Account): account is PolkadotAccount =>
  "polkadotResources" in account;

/**
 * A nomination per validator, active with the stake backing it, inactive otherwise; the bonded stake
 * backing no elected validator as one inactive position; each unlocking chunk as an unlocking position.
 */
export default function polkadotStakingPositions(account: Account): AccountStakingPosition[] {
  if (!isPolkadotAccount(account)) return [];
  const assetId = account.currency.id;
  const { lockedBalance, unlockingBalance, nominations, unlockings } = account.polkadotResources;
  const nominated = (nominations ?? []).map(({ address, value, status }) => ({
    id: `nomination:${address}`,
    assetId,
    validatorId: address,
    state: status === "active" ? "active" : "inactive",
    amount: BigNumber.max(0, value).toFixed(0),
  }));
  const backing = (nominations ?? []).reduce(
    (sum, { status, value }) => (status === "active" ? sum.plus(value) : sum),
    new BigNumber(0),
  );
  const idle = BigNumber.max(0, lockedBalance.minus(unlockingBalance).minus(backing));
  const now = Date.now();
  const unlocking = (unlockings ?? []).map(({ amount, completionDate }, index) => ({
    id: `unlocking:${completionDate.getTime()}:${index}`,
    assetId,
    state: completionDate.getTime() > now ? "deactivating" : "withdrawable",
    amount: BigNumber.max(0, amount).toFixed(0),
    unlockAt: completionDate.toISOString(),
  }));
  return [
    ...nominated,
    ...(idle.gt(0) ? [{ id: "bonded", assetId, state: "inactive", amount: idle.toFixed(0) }] : []),
    ...unlocking,
  ].map(position => AccountStakingPositionSchema.parse(position));
}
