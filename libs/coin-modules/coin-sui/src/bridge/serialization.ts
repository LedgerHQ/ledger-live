import { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type {
  SuiAccount,
  SuiAccountRaw,
  SuiResourcesRaw,
  SuiResources,
  SuiOperationExtra,
  SuiOperationExtraRaw,
} from "../types";

export function toSuiResourcesRaw(resources: SuiResources): SuiResourcesRaw {
  const { nonce } = resources;
  return {
    nonce,
  };
}

export function fromSuiResourcesRaw(resources: SuiResourcesRaw): SuiResources {
  const { nonce } = resources;
  return {
    nonce,
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const suiAccount = account as SuiAccount;
  const suiAccountRaw = accountRaw as SuiAccountRaw;
  if (suiAccount.suiResources) {
    suiAccountRaw.suiResources = toSuiResourcesRaw(suiAccount.suiResources);
  }
}
export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const suiResourcesRaw = (accountRaw as SuiAccountRaw).suiResources;
  if (suiResourcesRaw) {
    (account as SuiAccount).suiResources = fromSuiResourcesRaw(suiResourcesRaw);
  }
}

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw) {
  if (extraRaw) {
    //
  }

  const extra: SuiOperationExtra = {
    palletMethod: "balances.transferKeepAlive",
  };

  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra) {
  if (extra) {
    //
  }
  const extraRaw: SuiOperationExtraRaw = {};

  return extraRaw;
}
