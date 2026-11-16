import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { BalanceLock } from "@domain/entity-account-balance";
import { toBalanceLocks } from "../../account/balanceLocks";
import type { CardanoAccount } from "./types";

const isCardanoAccount = (account: Account): account is CardanoAccount =>
  "cardanoResources" in account;

/** The ADA held with tokens, kept out of spendable; the stake deposit is not in the balance. */
export default function cardanoBalanceLocks(account: Account): BalanceLock[] {
  if (!isCardanoAccount(account)) return [];
  const rewards = account.cardanoResources.delegation?.rewards ?? new BigNumber(0);
  return toBalanceLocks([
    ["reserve", account.balance.minus(rewards).minus(account.spendableBalance)],
  ]);
}
