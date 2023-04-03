import {
  SolanaAccount,
  SolanaAccountRaw,
  SolanaResources,
  SolanaResourcesRaw,
} from "./types";
import { Account, AccountRaw } from "@ledgerhq/types-live";

export function toSolanaResourcesRaw(
  resources: SolanaResources
): SolanaResourcesRaw {
  return {
    stakes: JSON.stringify(resources.stakes),
  };
}

export function fromSolanaResourcesRaw(
  resourcesRaw: SolanaResourcesRaw
): SolanaResources {
  return {
    stakes: JSON.parse(resourcesRaw.stakes),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const solanaAccount = account as SolanaAccount;
  if (solanaAccount.solanaResources) {
    (accountRaw as SolanaAccountRaw).solanaResources = toSolanaResourcesRaw(
      solanaAccount.solanaResources
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const solanaResourcesRaw = (accountRaw as SolanaAccountRaw).solanaResources;
  if (solanaResourcesRaw)
    (account as SolanaAccount).solanaResources =
      fromSolanaResourcesRaw(solanaResourcesRaw);
}
