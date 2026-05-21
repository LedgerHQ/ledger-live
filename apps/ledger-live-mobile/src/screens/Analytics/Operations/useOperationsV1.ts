import { groupAccountsOperationsByDay } from "@ledgerhq/ledger-wallet-framework/account/groupOperations";
import { isAddressPoisoningOperation } from "@ledgerhq/ledger-wallet-framework/operation";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useSelector } from "~/context/hooks";
import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";
import { useAddressPoisoningOperationsFamilies } from "@ledgerhq/live-common/hooks/useAddressPoisoningOperationsFamilies";

export type UseOperationsV1Options = {
  filterOperation?: (operation: Operation, account: AccountLike) => boolean;
};

export function useOperationsV1(
  accounts: AccountLike[],
  opCount: number,
  options?: UseOperationsV1Options,
) {
  const shouldFilterTokenOpsZeroAmount = useSelector(
    filterTokenOperationsZeroAmountEnabledSelector,
  );

  const addressPoisoningFamilies = useAddressPoisoningOperationsFamilies({
    shouldFilter: shouldFilterTokenOpsZeroAmount,
  });

  const externalFilter = options?.filterOperation;

  const filterOperation = useCallback(
    (operation: Operation, account: AccountLike) => {
      if (externalFilter && !externalFilter(operation, account)) {
        return false;
      }

      const isOperationPoisoned = isAddressPoisoningOperation(
        operation,
        account,
        addressPoisoningFamilies ? { families: addressPoisoningFamilies } : undefined,
      );

      const shouldFilterOperation = !(shouldFilterTokenOpsZeroAmount && isOperationPoisoned);

      return shouldFilterOperation;
    },
    [shouldFilterTokenOpsZeroAmount, addressPoisoningFamilies, externalFilter],
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
