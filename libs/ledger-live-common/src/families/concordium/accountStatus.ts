import type { Account } from "@ledgerhq/types-live";
import { isConcordiumAccount } from "@ledgerhq/coin-concordium/bridge/serialization";
import type { AccountStatus } from "@domain/entity-account-status";
import { defaultAccountStatus } from "../../account/accountStatus";

/** Onboarding for `isConcordiumAccount(account) && !account.concordiumResources.isOnboarded`, as `useConcordiumCreatableAccounts` decides. */
export default function concordiumAccountStatus(account: Account): AccountStatus {
  const status = defaultAccountStatus(account);
  return isConcordiumAccount(account) && !account.concordiumResources.isOnboarded
    ? { ...status, accountGate: { type: "onboarding" } }
    : status;
}
