import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { AccountStakingSchema, type AccountStaking } from "@domain/entity-account-staking";
import type { PolkadotAccount } from "./types";

const isPolkadotAccount = (account: Account): account is PolkadotAccount =>
  "polkadotResources" in account;

/**
 * The bond as one position nominating its validators, active while one of them is elected with it;
 * each unlocking chunk as an unlocking position.
 */
export default function polkadotStaking(account: Account): AccountStaking {
  if (!isPolkadotAccount(account)) return { positions: [] };
  const assetId = account.currency.id;
  const { lockedBalance, unlockingBalance, nominations, unlockings } = account.polkadotResources;
  const bonded = BigNumber.max(0, lockedBalance.minus(unlockingBalance));
  const validatorIds = (nominations ?? []).map(({ address }) => address);
  const now = Date.now();
  const unlocking = (unlockings ?? []).map(({ amount, completionDate }, index) => ({
    id: `unlocking:${completionDate.getTime()}:${index}`,
    assetId,
    state: completionDate.getTime() > now ? "deactivating" : "withdrawable",
    amount: BigNumber.max(0, amount).toFixed(0),
    unlockAt: completionDate.toISOString(),
  }));
  return AccountStakingSchema.parse({
    positions: [
      ...(bonded.gt(0)
        ? [
            {
              id: "bonded",
              assetId,
              validatorIds: validatorIds.length > 0 ? validatorIds : undefined,
              state: nominations?.some(({ status }) => status === "active") ? "active" : "inactive",
              amount: bonded.toFixed(0),
            },
          ]
        : []),
      ...unlocking,
    ],
  });
}
