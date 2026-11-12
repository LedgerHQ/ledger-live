import type { Account } from "@ledgerhq/types-live";
import { isCantonAccount } from "@ledgerhq/coin-canton/bridge/serialization";
import type { AccountStatus } from "@domain/entity-account-status";
import { defaultAccountStatus } from "../../account/accountStatus";

/** Onboarding for `isCantonAccount(account) && !account.cantonResources.isOnboarded`, as the Canton add-account and onboard flows decide. */
export default function cantonAccountStatus(account: Account): AccountStatus {
  const status = defaultAccountStatus(account);
  return isCantonAccount(account) && !account.cantonResources.isOnboarded
    ? { ...status, accountGate: { type: "onboarding" } }
    : status;
}
