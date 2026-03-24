import { useMemo, useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { AccountLike, Account, Operation } from "@ledgerhq/types-live";
import { flattenAccounts, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  getOperationAmountNumber,
  flattenOperationWithInternalsAndNfts,
} from "@ledgerhq/live-common/operation";
import { isAddressPoisoningOperation } from "@ledgerhq/ledger-wallet-framework/operation";
import { useAddressPoisoningOperationsFamilies } from "@ledgerhq/live-common/hooks/useAddressPoisoningOperationsFamilies";
import { useFilterTokenOperationsZeroAmount } from "~/renderer/actions/settings";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { isIncomingType } from "../utils/isIncomingType";
import type { OperationTableItem } from "../types";

type AccountInfo = { account: AccountLike; parentAccount?: Account };
type FilterFn = (operation: Operation, account: AccountLike) => boolean;

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
    const parentAccount = acc.type !== "Account" ? mainAccountsById.get(acc.parentId) : undefined;
    accountsById.set(acc.id, { account: acc, parentAccount });
  }

  return accountsById;
}

function deduplicateOperations(acc: AccountLike): Operation[] {
  const existingHashes = new Set(acc.operations.map(op => op.hash));
  return [
    ...acc.pendingOperations.filter(pendingOp => !existingHashes.has(pendingOp.hash)),
    ...acc.operations,
  ];
}

function toTableItem(operation: Operation, info: AccountInfo): OperationTableItem {
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
  };
}

function collectAccountOperations(
  info: AccountInfo,
  filterOperation: FilterFn,
): OperationTableItem[] {
  const allOps = deduplicateOperations(info.account);
  return allOps.flatMap(rawOp => {
    if (!filterOperation(rawOp, info.account)) return [];
    return flattenOperationWithInternalsAndNfts(rawOp)
      .filter(op => filterOperation(op, info.account))
      .map(op => toTableItem(op, info));
  });
}

function buildOperationItems(
  accountsMap: Map<string, AccountInfo>,
  filterOperation: FilterFn,
): OperationTableItem[] {
  return [...accountsMap.values()].flatMap(info => collectAccountOperations(info, filterOperation));
}

export function useHistoryOperations(): OperationTableItem[] {
  const accounts = useSelector(accountsSelector);

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
    const accountsMap = buildAccountsMap(accounts);
    const items = buildOperationItems(accountsMap, filterOperation);
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [accounts, filterOperation]);
}
