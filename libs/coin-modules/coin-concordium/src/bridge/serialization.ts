import type { Account, AccountRaw } from "@ledgerhq/types-live";
import {
  type ConcordiumAccount,
  type ConcordiumAccountRaw,
  type ConcordiumResources,
  type ConcordiumResourcesRaw,
} from "../types";

export function isConcordiumAccount(account: Account): account is ConcordiumAccount {
  return account.currency?.family === "concordium" && "concordiumResources" in account;
}

function toResourcesRaw(r: ConcordiumResources): ConcordiumResourcesRaw {
  const { isOnboarded, credId, publicKey, identityIndex, credNumber, ipIdentity } = r;
  // Include all fields, even if undefined, to ensure proper serialization
  const result: ConcordiumResourcesRaw = {
    isOnboarded,
    credId,
    publicKey,
    identityIndex,
    credNumber,
    ipIdentity,
  };
  return result;
}

function fromResourcesRaw(r: ConcordiumResourcesRaw): ConcordiumResources {
  // Directly return all fields from raw format
  const result: ConcordiumResources = {
    isOnboarded: r.isOnboarded,
    credId: r.credId,
    publicKey: r.publicKey,
    identityIndex: r.identityIndex,
    credNumber: r.credNumber,
    ipIdentity: r.ipIdentity,
  };
  return result;
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const concordiumAccount = account as ConcordiumAccount;
  if (concordiumAccount.concordiumResources) {
    (accountRaw as ConcordiumAccountRaw).concordiumResources = toResourcesRaw(
      concordiumAccount.concordiumResources,
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  const concordiumAccountRaw = accountRaw as ConcordiumAccountRaw;
  if (concordiumAccountRaw.concordiumResources) {
    (account as ConcordiumAccount).concordiumResources = fromResourcesRaw(
      concordiumAccountRaw.concordiumResources,
    );
  }
}
