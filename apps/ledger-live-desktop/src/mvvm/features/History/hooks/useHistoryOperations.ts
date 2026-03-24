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

function getOperationAddress(operation: Operation): string {
  if (isIncomingType(operation.type)) {
    return operation.senders[0] ?? "";
  }
  return operation.recipients[0] ?? "";
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
    const allAccounts = flattenAccounts(accounts);
    const accountsById = new Map<string, { account: AccountLike; parentAccount?: Account }>();

    for (const acc of allAccounts) {
      let parentAccount: Account | undefined;
      if (acc.type !== "Account") {
        const parent = accounts.find(a => a.id === acc.parentId);
        if (parent && parent.type === "Account") {
          parentAccount = parent;
        }
      }
      accountsById.set(acc.id, { account: acc, parentAccount });
    }

    const items: OperationTableItem[] = [];

    for (const acc of allAccounts) {
      const info = accountsById.get(acc.id);
      if (!info) continue;
      const { account, parentAccount } = info;

      const allOps = [
        ...acc.pendingOperations.filter(
          pendingOp => !acc.operations.some(op => op.hash === pendingOp.hash),
        ),
        ...acc.operations,
      ];

      for (const rawOp of allOps) {
        if (!filterOperation(rawOp, account)) continue;

        const flatOps = flattenOperationWithInternalsAndNfts(rawOp);
        for (const operation of flatOps) {
          if (!filterOperation(operation, account)) continue;

          const currency = getAccountCurrency(account);
          const amount = getOperationAmountNumber(operation);
          const address = getOperationAddress(operation);

          items.push({
            id: `${account.id}_${operation.id}`,
            operation,
            account,
            parentAccount,
            date: operation.date,
            type: operation.type,
            address,
            amount,
            currency,
          });
        }
      }
    }

    items.sort((a, b) => b.date.getTime() - a.date.getTime());

    return items;
  }, [accounts, filterOperation]);
}
