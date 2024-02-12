import BigNumber from "bignumber.js";
import {
  type ElrondResourcesRaw,
  type ElrondResources,
  type ElrondAccountRaw,
  type ElrondAccount,
  type ElrondOperationExtraRaw,
  type ElrondOperationExtra,
  isElrondOperationExtraRaw,
  isElrondOperationExtra,
} from "./types";
import type { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";

export function toElrondResourcesRaw(r: ElrondResources): ElrondResourcesRaw {
  const { nonce, delegations, isGuarded } = r;
  return {
    nonce,
    delegations,
    isGuarded,
  };
}
export function fromElrondResourcesRaw(r: ElrondResourcesRaw): ElrondResources {
  const { nonce, delegations, isGuarded } = r;
  return {
    nonce,
    delegations,
    isGuarded,
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const elrondAccount = account as ElrondAccount;
  if (elrondAccount.elrondResources) {
    (accountRaw as ElrondAccountRaw).elrondResources = toElrondResourcesRaw(
      elrondAccount.elrondResources,
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const elrondResourcesRaw = (accountRaw as ElrondAccountRaw).elrondResources;
  if (elrondResourcesRaw)
    (account as ElrondAccount).elrondResources = fromElrondResourcesRaw(elrondResourcesRaw);
}

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw) {
  const extra: ElrondOperationExtra = {};
  if (!isElrondOperationExtraRaw(extraRaw)) {
    // All fields might be undefined
    return extra;
  }

  if (extraRaw.amount) {
    extra.amount = new BigNumber(extraRaw.amount);
  }
  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra) {
  const extraRaw: ElrondOperationExtraRaw = {};
  if (!isElrondOperationExtra(extra)) {
    // All fields might be undefined
    return extraRaw;
  }

  if (extra.amount) {
    extraRaw.amount = extra.amount.toString();
  }
  return extraRaw;
}
