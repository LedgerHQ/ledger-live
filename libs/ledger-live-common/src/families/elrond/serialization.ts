import type {
  ElrondResourcesRaw,
  ElrondResources,
  ElrondAccountRaw,
  ElrondAccount,
} from "./types";
import type { Account, AccountRaw } from "@ledgerhq/types-live";

export function toElrondResourcesRaw(r: ElrondResources): ElrondResourcesRaw {
  const { nonce, delegations } = r;
  return {
    nonce,
    delegations,
  };
}
export function fromElrondResourcesRaw(r: ElrondResourcesRaw): ElrondResources {
  const { nonce, delegations } = r;
  return {
    nonce,
    delegations,
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const elrondAccount = account as ElrondAccount;
  if (elrondAccount.elrondResources) {
    (accountRaw as ElrondAccountRaw).elrondResources = toElrondResourcesRaw(
      elrondAccount.elrondResources
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const elrondResourcesRaw = (accountRaw as ElrondAccountRaw).elrondResources;
  if (elrondResourcesRaw)
    (account as ElrondAccount).elrondResources =
      fromElrondResourcesRaw(elrondResourcesRaw);
}
