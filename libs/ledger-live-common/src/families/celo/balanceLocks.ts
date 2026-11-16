import type { Account } from "@ledgerhq/types-live";
import type { BalanceLock } from "@domain/entity-account-balance";
import { toBalanceLocks } from "../../account/balanceLocks";
import type { CeloAccount } from "./types";

const isCeloAccount = (account: Account): account is CeloAccount => "celoResources" in account;

/** Locked CELO is staked; pending withdrawals left the locked total and are not in the synced balance. */
export default function celoBalanceLocks(account: Account): BalanceLock[] {
  if (!isCeloAccount(account)) return [];
  return toBalanceLocks([["staked", account.celoResources.lockedBalance]]);
}
