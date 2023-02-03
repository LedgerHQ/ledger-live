import type {
  TezosAccount,
  TezosAccountRaw,
  TezosResources,
  TezosResourcesRaw,
} from "./types";
import { Account, AccountRaw } from "@ledgerhq/types-live";
import isEqual from "lodash/isEqual";

export function toTezosResourcesRaw(r: TezosResources): TezosResourcesRaw {
  const { revealed, counter } = r;
  return { revealed, counter };
}

export function fromTezosResourcesRaw(r: TezosResourcesRaw): TezosResources {
  const { revealed, counter } = r;
  return { revealed, counter };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const tezosAccount = account as TezosAccount;
  if (tezosAccount.tezosResources) {
    (accountRaw as TezosAccountRaw).tezosResources = toTezosResourcesRaw(
      tezosAccount.tezosResources
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const tezosResourcesRaw = (accountRaw as TezosAccountRaw).tezosResources;
  if (tezosResourcesRaw)
    (account as TezosAccount).tezosResources =
      fromTezosResourcesRaw(tezosResourcesRaw);
}

export function applyReconciliation(
  account: Account,
  updatedRaw: AccountRaw,
  next: Account
): boolean {
  let changed = false;
  const tezosAcc = account as TezosAccount;
  const tezosUpdatedRaw = updatedRaw as TezosAccountRaw;
  if (
    tezosUpdatedRaw.tezosResources &&
    (!tezosAcc.tezosResources ||
      !isEqual(
        toTezosResourcesRaw(tezosAcc.tezosResources),
        tezosUpdatedRaw.tezosResources
      ))
  ) {
    (next as TezosAccount).tezosResources = fromTezosResourcesRaw(
      tezosUpdatedRaw.tezosResources
    );
    changed = true;
  }
  return changed;
}
