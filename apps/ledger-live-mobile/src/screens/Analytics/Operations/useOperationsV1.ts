import { groupAccountsOperationsByDay } from "@ledgerhq/ledger-wallet-framework/account/groupOperations";
import { isAddressPoisoningOperation } from "@ledgerhq/ledger-wallet-framework/operation";
import {
  isSmallValueOperation,
  SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
} from "@ledgerhq/live-common/hideSmallValueTokenOperations/smallValueOperationsThreshold";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import { useCallback, useEffect } from "react";
import { useSelector } from "~/context/hooks";
import { addExtraSessionTrackingPair } from "~/actions/general";
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

  // The dust threshold is expressed in USD but compared in the user's counter
  // value. Without a USD -> counter tracking pair, calculate(USD -> counter)
  // returns undefined for non-USD users and the filter silently no-ops. Request
  // it here so every screen that filters (asset detail, portfolio, account…)
  // gets the rate, not only the dedicated Operations list screen.
  useEffect(() => {
    if (
      !shouldHideSmallValueTokenOperations ||
      !userCounterValueCurrency ||
      userCounterValueCurrency.ticker === SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY.ticker
    ) {
      return;
    }

    addExtraSessionTrackingPair({
      from: SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
      to: userCounterValueCurrency,
      startDate: new Date(),
    });
  }, [shouldHideSmallValueTokenOperations, userCounterValueCurrency]);

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
        isSmallValueOperation({
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
