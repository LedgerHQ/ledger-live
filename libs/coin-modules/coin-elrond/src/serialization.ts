import BigNumber from "bignumber.js";
import {
  type MultiversxResourcesRaw,
  type MultiversxResources,
  type MultiversxAccountRaw,
  type MultiversxAccount,
  type MultiversxOperationExtraRaw,
  type MultiversxOperationExtra,
  isMultiversxOperationExtraRaw,
  isMultiversxOperationExtra,
} from "./types";
import type { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";

export function toMultiversxResourcesRaw(r: MultiversxResources): MultiversxResourcesRaw {
  const { nonce, delegations, isGuarded } = r;
  return {
    nonce,
    delegations,
    isGuarded,
  };
}

export function fromMultiversxResourcesRaw(r: MultiversxResourcesRaw): MultiversxResources {
  const { nonce, delegations, isGuarded } = r;
  return {
    nonce,
    delegations,
    isGuarded,
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const multiversxAccount = account as MultiversxAccount;
  if (multiversxAccount.multiversxResources) {
    (accountRaw as MultiversxAccountRaw).multiversxResources = toMultiversxResourcesRaw(
      multiversxAccount.multiversxResources,
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const multiversxResourcesRaw = (accountRaw as MultiversxAccountRaw).multiversxResources;
  if (multiversxResourcesRaw)
    (account as MultiversxAccount).multiversxResources =
      fromMultiversxResourcesRaw(multiversxResourcesRaw);
}

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw) {
  const extra: MultiversxOperationExtra = {};
  if (!isMultiversxOperationExtraRaw(extraRaw)) {
    // All fields might be undefined
    return extra;
  }

  if (extraRaw.amount) {
    extra.amount = new BigNumber(extraRaw.amount);
  }
  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra) {
  const extraRaw: MultiversxOperationExtraRaw = {};
  if (!isMultiversxOperationExtra(extra)) {
    // All fields might be undefined
    return extraRaw;
  }

  if (extra.amount) {
    extraRaw.amount = extra.amount.toString();
  }
  return extraRaw;
}
