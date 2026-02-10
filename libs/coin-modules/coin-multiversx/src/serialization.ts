import type { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  type MultiversXResourcesRaw,
  type MultiversXResources,
  type MultiversXAccountRaw,
  type MultiversXAccount,
  type MultiversXOperationExtraRaw,
  type MultiversXOperationExtra,
  isMultiversXOperationExtraRaw,
  isMultiversXOperationExtra,
} from "./types";

export function toMultiversXResourcesRaw(r: MultiversXResources): MultiversXResourcesRaw {
  const { nonce, delegations, isGuarded } = r;
  return {
    nonce,
    delegations,
    isGuarded,
  };
}

export function fromMultiversXResourcesRaw(r: MultiversXResourcesRaw): MultiversXResources {
  const { nonce, delegations, isGuarded } = r;
  return {
    nonce,
    delegations,
    isGuarded,
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const multiversxAccount = account as MultiversXAccount;
  if (multiversxAccount.multiversxResources) {
    (accountRaw as MultiversXAccountRaw).multiversxResources = toMultiversXResourcesRaw(
      multiversxAccount.multiversxResources,
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const multiversxResourcesRaw = (accountRaw as MultiversXAccountRaw).multiversxResources;
  if (multiversxResourcesRaw)
    (account as MultiversXAccount).multiversxResources =
      fromMultiversXResourcesRaw(multiversxResourcesRaw);
}

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw) {
  const extra: MultiversXOperationExtra = {};
  if (!isMultiversXOperationExtraRaw(extraRaw)) {
    // All fields might be undefined
    return extra;
  }

  if (extraRaw.amount) {
    extra.amount = new BigNumber(extraRaw.amount);
  }
  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra) {
  const extraRaw: MultiversXOperationExtraRaw = {};
  if (!isMultiversXOperationExtra(extra)) {
    // All fields might be undefined
    return extraRaw;
  }

  if (extra.amount) {
    extraRaw.amount = extra.amount.toString();
  }
  return extraRaw;
}
