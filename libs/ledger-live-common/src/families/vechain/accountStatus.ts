import type { Account } from "@ledgerhq/types-live";
import { isAccountEmpty } from "@ledgerhq/coin-vechain";
import type { AccountStatus } from "@domain/entity-account-status";
import { defaultAccountStatus } from "../../account/accountStatus";

/** Exists by the VeChain scan rule (an empty VTHO does not count): a sync overrides `Account.used` with the generic one. */
export default function vechainAccountStatus(account: Account): AccountStatus {
  return { ...defaultAccountStatus(account), used: !isAccountEmpty(account) };
}
