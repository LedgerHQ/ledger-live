import type { Account } from "@ledgerhq/types-live";
import type { BalanceLock } from "@domain/entity-account-balance";
import { toBalanceLocks } from "../../account/balanceLocks";
import type { PolkadotAccount } from "./types";

const isPolkadotAccount = (account: Account): account is PolkadotAccount =>
  "polkadotResources" in account;

/** Bonded minus unlocking is staked; unlocking, withdrawable once unlocked, is unbonding, as the account page splits them. */
export default function polkadotBalanceLocks(account: Account): BalanceLock[] {
  if (!isPolkadotAccount(account)) return [];
  const { lockedBalance, unlockingBalance } = account.polkadotResources;
  return toBalanceLocks([
    ["staked", lockedBalance.minus(unlockingBalance)],
    ["unbonding", unlockingBalance],
  ]);
}
