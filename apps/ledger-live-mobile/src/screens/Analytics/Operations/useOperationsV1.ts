import { groupAccountsOperationsByDay } from "@ledgerhq/ledger-wallet-framework/account/groupOperations";
import { isAddressPoisoningOperation } from "@ledgerhq/ledger-wallet-framework/operation";
import { isSmallValueTokenOperation } from "@ledgerhq/live-common/hideSmallValueTokenOperations/smallValueOperationsThreshold";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useSelector } from "~/context/hooks";
import {
  counterValueCurrencySelector,
  filterTokenOperationsZeroAmountEnabledSelector,
  hideSmallValueTokenOperationsEffectiveSelector,
} from "~/reducers/settings";
import { countervaluesStateSelector } from "~/reducers/countervalues";
import { useAddressPoisoningOperationsFamilies } from "@ledgerhq/live-common/hooks/useAddressPoisoningOperationsFamilies";
import { HISTORY_DUST_FILTER_THRESHOLD_USD } from "LLM/features/OperationsHistory/constants";

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
  const shouldHideSmallValueTokenOperations = useSelector(
    hideSmallValueTokenOperationsEffectiveSelector,
  );
  const countervaluesState = useSelector(state =>
    shouldHideSmallValueTokenOperations ? countervaluesStateSelector(state) : undefined,
  );
  const userCounterValueCurrency = useSelector(state =>
    shouldHideSmallValueTokenOperations ? counterValueCurrencySelector(state) : undefined,
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

      if (!shouldFilterOperation) return false;

      if (
        shouldHideSmallValueTokenOperations &&
        countervaluesState &&
        userCounterValueCurrency &&
        isSmallValueTokenOperation({
          operation,
          account,
          countervaluesState,
          userCounterValueCurrency,
          thresholdUsd: HISTORY_DUST_FILTER_THRESHOLD_USD,
        })
      ) {
        return false;
      }

      return true;
    },
    [
      shouldFilterTokenOpsZeroAmount,
      addressPoisoningFamilies,
      externalFilter,
      shouldHideSmallValueTokenOperations,
      countervaluesState,
      userCounterValueCurrency,
    ],
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
