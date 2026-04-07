import memoize from "lodash/memoize";
import { getCryptoCurrencyById } from "../currencies";
import type {
  Account,
  AccountBridge,
  AccountRaw,
  AccountUserData,
  BalanceHistory,
  BalanceHistoryRaw,
  Operation,
  OperationRaw,
  TokenAccount,
  TransactionCommon,
} from "@ledgerhq/types-live";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  fromAccountRaw as commonFromAccountRaw,
  toAccountRaw as commonToAccountRaw,
  fromOperationRaw as commonFromOperationRaw,
  toOperationRaw as commonToOperationRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization/index";
import { getAccountBridgeByFamily } from "../bridge/impl";

export function toBalanceHistoryRaw(b: BalanceHistory): BalanceHistoryRaw {
  return b.map(({ date, value }) => [date.toISOString(), value.toString()]);
}

export const toOperationRaw = (
  operation: Operation,
  preserveSubOperation?: boolean,
  bridge?: AccountBridge<TransactionCommon>,
): OperationRaw => {
  return commonToOperationRaw(operation, preserveSubOperation, bridge?.toOperationExtraRaw);
};

export const fromOperationRaw = async (
  operationRaw: OperationRaw,
  accountId: string,
  subAccounts?: TokenAccount[] | null | undefined,
): Promise<Operation> => {
  let fromOperationExtraRaw: AccountBridge<TransactionCommon>["fromOperationExtraRaw"] | undefined;
  if (operationRaw.extra) {
    const family = inferFamilyFromAccountId(operationRaw.accountId);
    if (family) {
      const bridge = await getAccountBridgeByFamily(family, accountId).catch(() => undefined);
      fromOperationExtraRaw = bridge?.fromOperationExtraRaw;
    }
  }
  return commonFromOperationRaw(operationRaw, accountId, subAccounts, fromOperationExtraRaw);
};

export async function fromAccountRaw(rawAccount: AccountRaw): Promise<Account> {
  const currency = getCryptoCurrencyById(rawAccount.currencyId);
  const bridge = await getAccountBridgeByFamily(currency.family, rawAccount.id).catch(
    () => undefined,
  );
  return await commonFromAccountRaw(rawAccount, {
    assignFromAccountRaw: bridge?.assignFromAccountRaw,
    assignFromTokenAccountRaw: bridge?.assignFromTokenAccountRaw,
    fromOperationExtraRaw: bridge?.fromOperationExtraRaw,
  });
}

export async function toAccountRaw(
  account: Account,
  userData?: AccountUserData,
  bridge?: AccountBridge<TransactionCommon>,
): Promise<AccountRaw> {
  const resolvedBridge =
    bridge ??
    (await getAccountBridgeByFamily(account.currency.family, account.id).catch(() => undefined));
  const commonAccountRaw = commonToAccountRaw(account, {
    assignToAccountRaw: resolvedBridge?.assignToAccountRaw,
    assignToTokenAccountRaw: resolvedBridge?.assignToTokenAccountRaw,
    toOperationExtraRaw: resolvedBridge?.toOperationExtraRaw,
  });
  if (userData) {
    commonAccountRaw.name = userData.name;
    commonAccountRaw.starred = userData.starredIds.includes(commonAccountRaw.id);
    for (const tokenAccount of commonAccountRaw.subAccounts || []) {
      tokenAccount.starred = userData.starredIds.includes(tokenAccount.id);
    }
  }
  return commonAccountRaw;
}

const inferFamilyFromAccountId: (accountId: string) => string | null | undefined = memoize(
  accountId => {
    try {
      const { currencyId } = decodeAccountId(accountId);
      return getCryptoCurrencyById(currencyId).family;
    } catch {
      return null;
    }
  },
);
