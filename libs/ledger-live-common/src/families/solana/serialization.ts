import {
  SolanaAccount,
  SolanaAccountRaw,
  SolanaResources,
  SolanaResourcesRaw,
} from "./types";
import { Account, AccountRaw } from "@ledgerhq/types-live";
import { isEqual } from "lodash";

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

export function applyReconciliation(
  account: Account,
  updatedRaw: AccountRaw,
  next: Account
): boolean {
  let changed = false;
  const solanaAcc = account as SolanaAccount;
  const solanaUpdatedRaw = updatedRaw as SolanaAccountRaw;

  if (
    solanaUpdatedRaw.solanaResources &&
    (!solanaAcc.solanaResources ||
      !isEqual(
        toSolanaResourcesRaw(solanaAcc.solanaResources),
        solanaUpdatedRaw.solanaResources
      ))
  ) {
    (next as SolanaAccount).solanaResources = fromSolanaResourcesRaw(
      solanaUpdatedRaw.solanaResources
    );
    changed = true;
  }
  return changed;
}
