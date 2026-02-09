import { groupAccountsOperationsByDay } from "@ledgerhq/coin-framework/lib/account/groupOperations";
import { isAddressPoisoningOperation } from "@ledgerhq/coin-framework/lib/operation";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useSelector } from "~/context/hooks";
import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";
import { useAddressPoisoningOperationsFamilies } from "@ledgerhq/live-common/hooks/useAddressPoisoningOperationsFamilies";

export function useOperationsV1(accounts: AccountLike[], opCount: number) {
  const shouldFilterTokenOpsZeroAmount = useSelector(
    filterTokenOperationsZeroAmountEnabledSelector,
  );

  const addressPoisoningFamilies = useAddressPoisoningOperationsFamilies({
    shouldFilter: shouldFilterTokenOpsZeroAmount,
  });

  const filterOperation = useCallback(
    (operation: Operation, account: AccountLike) => {
      const isOperationPoisoned = isAddressPoisoningOperation(
        operation,
        account,
        addressPoisoningFamilies ? { families: addressPoisoningFamilies } : undefined,
      );

      const shouldFilterOperation = !(shouldFilterTokenOpsZeroAmount && isOperationPoisoned);

      return shouldFilterOperation;
    },
    [shouldFilterTokenOpsZeroAmount, addressPoisoningFamilies],
  );

  const { sections, completed } = groupAccountsOperationsByDay(accounts, {
    count: opCount,
    withSubAccounts: true,
    filterOperation,
  });

  return {
    sections,
    completed,
  };
}
