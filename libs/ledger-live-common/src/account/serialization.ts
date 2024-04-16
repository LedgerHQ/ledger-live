import { getCryptoCurrencyById } from "../currencies";
import { inferFamilyFromAccountId } from "@ledgerhq/coin-framework/account/index";

import type {
  Account,
  AccountBridge,
  AccountRaw,
  BalanceHistory,
  BalanceHistoryRaw,
  Operation,
  OperationRaw,
  SubAccount,
  TransactionCommon,
} from "@ledgerhq/types-live";
import {
  fromAccountRaw as commonFromAccountRaw,
  toAccountRaw as commonToAccountRaw,
  fromOperationRaw as commonFromOperationRaw,
  toOperationRaw as commonToOperationRaw,
} from "@ledgerhq/coin-framework/serialization/index";
import { getAccountBridge } from "../bridge";
import { getAccountBridgeByFamily } from "../bridge/impl";

export function toBalanceHistoryRaw(b: BalanceHistory): BalanceHistoryRaw {
  return b.map(({ date, value }) => [date.toISOString(), value.toString()]);
}

export const toOperationRaw = (
  operation: Operation,
  preserveSubOperation?: boolean,
): OperationRaw => {
  let toOperationRaw: AccountBridge<TransactionCommon>["toOperationExtraRaw"] | undefined;
  if (operation.extra) {
    const family = inferFamilyFromAccountId(operation.accountId);

    if (family) {
      const bridge = getAccountBridgeByFamily(family, operation.accountId);
      toOperationRaw = bridge.toOperationExtraRaw;
    }
  }

  return commonToOperationRaw(operation, preserveSubOperation, toOperationRaw);
};

export const fromOperationRaw = (
  operationRaw: OperationRaw,
  accountId: string,
  subAccounts?: SubAccount[] | null | undefined,
): Operation => {
  let fromOperationRaw: AccountBridge<TransactionCommon>["fromOperationExtraRaw"] | undefined;

  if (operationRaw.extra) {
    const family = inferFamilyFromAccountId(operationRaw.accountId);

    if (family) {
      const bridge = getAccountBridgeByFamily(family, accountId);
      fromOperationRaw = bridge.fromOperationExtraRaw;
    }
  }

  return commonFromOperationRaw(operationRaw, accountId, subAccounts, fromOperationRaw);
};

export function fromAccountRaw(rawAccount: AccountRaw): Account {
  const currency = getCryptoCurrencyById(rawAccount.currencyId);
  const bridge = getAccountBridgeByFamily(currency.family, rawAccount.id);

  return commonFromAccountRaw(rawAccount, {
    assignFromAccountRaw: bridge.assignFromAccountRaw,
    fromOperationExtraRaw: bridge.fromOperationExtraRaw,
  });
}
export function toAccountRaw(account: Account): AccountRaw {
  const bridge = getAccountBridge(account);

  return commonToAccountRaw(account, {
    assignToAccountRaw: bridge.assignToAccountRaw,
    toOperationExtraRaw: bridge.toOperationExtraRaw,
  });
}
