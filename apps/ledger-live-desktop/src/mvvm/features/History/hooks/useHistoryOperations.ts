import { useMemo, useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { AccountLike, Account, Operation } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  flattenAccounts,
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import {
  getOperationAmountNumber,
  flattenOperationWithInternalsAndNfts,
  isConfirmedOperation,
} from "@ledgerhq/live-common/operation";
import { isAddressPoisoningOperation } from "@ledgerhq/ledger-wallet-framework/operation";
import { useAddressPoisoningOperationsFamilies } from "@ledgerhq/live-common/hooks/useAddressPoisoningOperationsFamilies";
import { useFilterTokenOperationsZeroAmount } from "~/renderer/actions/settings";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { currencySettingsDefaults, type CurrencySettings } from "~/renderer/reducers/settings";
import { isIncomingType } from "../utils/isIncomingType";
import type { OperationTableItem } from "../types";

type AccountInfo = { account: AccountLike; parentAccount?: Account };
type FilterFn = (operation: Operation, account: AccountLike) => boolean;
type TaggedOperation = { operation: Operation; isPending: boolean };

function getOperationAddress(operation: Operation): string {
  if (isIncomingType(operation.type)) {
    return operation.senders[0] ?? "";
  }
  return operation.recipients[0] ?? "";
}

function buildAccountsMap(accounts: Account[]): Map<string, AccountInfo> {
  const allAccounts = flattenAccounts(accounts);
  const mainAccountsById = new Map(
    accounts.filter((a): a is Account => a.type === "Account").map(a => [a.id, a]),
  );
  const accountsById = new Map<string, AccountInfo>();

  for (const acc of allAccounts) {
    const parentAccount = acc.type === "Account" ? undefined : mainAccountsById.get(acc.parentId);
    accountsById.set(acc.id, { account: acc, parentAccount });
  }

  return accountsById;
}

function deduplicateAndTagOperations(
  acc: AccountLike,
  mainAccount: Account,
  confirmationsNb: number,
): TaggedOperation[] {
  const existingHashes = new Set(acc.operations.map(op => op.hash));

  const pending: TaggedOperation[] = acc.pendingOperations
    .filter(op => !existingHashes.has(op.hash))
    .map(operation => ({ operation, isPending: true }));

  const confirmed: TaggedOperation[] = acc.operations.map(operation => ({
    operation,
    isPending: !isConfirmedOperation(operation, mainAccount, confirmationsNb),
  }));

  return [...pending, ...confirmed];
}

function toTableItem(
  operation: Operation,
  info: AccountInfo,
  isPending: boolean,
): OperationTableItem {
  const { account, parentAccount } = info;
  return {
    id: `${account.id}_${operation.id}`,
    operation,
    account,
    parentAccount,
    date: operation.date,
    type: operation.type,
    address: getOperationAddress(operation),
    amount: getOperationAmountNumber(operation),
    currency: getAccountCurrency(account),
    isPending,
  };
}

function collectAccountOperations(
  info: AccountInfo,
  filterOperation: FilterFn,
  mainAccount: Account,
  confirmationsNb: number,
): OperationTableItem[] {
  const taggedOps = deduplicateAndTagOperations(info.account, mainAccount, confirmationsNb);
  return taggedOps.flatMap(({ operation: rawOp, isPending }) => {
    if (!filterOperation(rawOp, info.account)) return [];
    return flattenOperationWithInternalsAndNfts(rawOp)
      .filter(op => filterOperation(op, info.account))
      .map(op => toTableItem(op, info, isPending));
  });
}

function buildOperationItems(
  accountsMap: Map<string, AccountInfo>,
  filterOperation: FilterFn,
  getConfirmationsNb: (mainAccount: Account) => number,
): OperationTableItem[] {
  return [...accountsMap.values()].flatMap(info => {
    const mainAccount = getMainAccount(info.account, info.parentAccount);
    const confirmationsNb = getConfirmationsNb(mainAccount);
    return collectAccountOperations(info, filterOperation, mainAccount, confirmationsNb);
  });
}

function getConfirmationsNbForCurrency(
  currenciesSettings: Record<string, CurrencySettings>,
  currency: CryptoCurrency,
): number {
  const obj = currenciesSettings[currency.ticker];
  if (obj) return obj.confirmationsNb;
  const defs = currencySettingsDefaults(currency);
  return defs.confirmationsNb ? defs.confirmationsNb.def : 0;
}

export function useHistoryOperations(): OperationTableItem[] {
  const accounts = useSelector(accountsSelector);
  const currenciesSettings = useSelector(state => state.settings.currenciesSettings);

  const [shouldFilterTokenOpsZeroAmount] = useFilterTokenOperationsZeroAmount();
  const addressPoisoningFamilies = useAddressPoisoningOperationsFamilies({
    shouldFilter: shouldFilterTokenOpsZeroAmount,
  });

  const filterOperation = useCallback(
    (operation: Operation, account: AccountLike) => {
      if (!shouldFilterTokenOpsZeroAmount) return true;
      return !isAddressPoisoningOperation(
        operation,
        account,
        addressPoisoningFamilies ? { families: addressPoisoningFamilies } : undefined,
      );
    },
    [shouldFilterTokenOpsZeroAmount, addressPoisoningFamilies],
  );

  return useMemo(() => {
    const getConfirmationsNb = (mainAccount: Account) =>
      getConfirmationsNbForCurrency(currenciesSettings, mainAccount.currency);

    const accountsMap = buildAccountsMap(accounts);
    const items = buildOperationItems(accountsMap, filterOperation, getConfirmationsNb);
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [accounts, filterOperation, currenciesSettings]);
}
