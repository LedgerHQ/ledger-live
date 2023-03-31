import type {
  TezosAccount,
  TezosAccountRaw,
  TezosResources,
  TezosResourcesRaw,
} from "./types";
import { Account, AccountRaw } from "@ledgerhq/types-live";

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
