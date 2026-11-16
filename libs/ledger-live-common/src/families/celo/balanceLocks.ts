import type { Account } from "@ledgerhq/types-live";
import type { BalanceLock } from "@domain/entity-account-balance";
import { sumOf, toBalanceLocks } from "../../account/balanceLocks";
import type { CeloAccount } from "./types";

const isCeloAccount = (account: Account): account is CeloAccount => "celoResources" in account;

/** Locked CELO is staked, its pending withdrawals are unbonding. */
export default function celoBalanceLocks(account: Account): BalanceLock[] {
  if (!isCeloAccount(account)) return [];
  const { lockedBalance, pendingWithdrawals } = account.celoResources;
  return toBalanceLocks([
    ["staked", lockedBalance],
    ["unbonding", sumOf((pendingWithdrawals ?? []).map(({ value }) => value))],
  ]);
}
