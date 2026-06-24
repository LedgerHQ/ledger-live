import { useMemo, useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { selectFeature } from "@shared/feature-flags";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { isAddressPoisoningOperation } from "@ledgerhq/ledger-wallet-framework/operation";
import { isSmallValueTokenOperation } from "@ledgerhq/live-common/hideSmallValueTokenOperations/smallValueOperationsThreshold";
import {
  counterValueCurrencySelector,
  filterTokenOperationsZeroAmountSelector,
  hideSmallValueTokenOperationsSelector,
} from "~/renderer/reducers/settings";
import {
  buildHistoryOperationItems,
  getAddressPoisoningFamiliesForFilter,
} from "../utils/historyOperationItems";
import { lastSeenOperationDateSelector } from "~/renderer/reducers/history";
import type { State } from "~/renderer/reducers";
import type { OperationTableItem } from "../types";
import { HISTORY_DUST_FILTER_THRESHOLD_USD } from "../constants";

/** Same pipeline as the full History list, limited to the given root portfolio accounts. */
export function useHistoryOperationItemsForRootAccounts(
  rootAccounts: Account[],
): OperationTableItem[] {
  const currenciesSettings = useSelector((state: State) => state.settings.currenciesSettings);
  const lastSeenOperationDate = useSelector(lastSeenOperationDateSelector);
  const shouldFilterTokenOps = useSelector(filterTokenOperationsZeroAmountSelector);
  const shouldHideSmallValueTokenOperations = useSelector(hideSmallValueTokenOperationsSelector);
  const countervaluesState = useCountervaluesState();
  const userCounterValueCurrency = useSelector(counterValueCurrencySelector);
  const poisoningFeature = useSelector((state: State) =>
    selectFeature(state, "addressPoisoningOperationsFilter"),
  );

  const addressPoisoningFamilies = useMemo(
    () => getAddressPoisoningFamiliesForFilter(shouldFilterTokenOps, poisoningFeature),
    [shouldFilterTokenOps, poisoningFeature],
  );

  const filterOperation = useCallback(
    (operation: Operation, account: AccountLike) => {
      if (
        shouldFilterTokenOps &&
        isAddressPoisoningOperation(
          operation,
          account,
          addressPoisoningFamilies ? { families: addressPoisoningFamilies } : undefined,
        )
      ) {
        return false;
      }

      if (
        shouldHideSmallValueTokenOperations &&
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
      shouldFilterTokenOps,
      addressPoisoningFamilies,
      shouldHideSmallValueTokenOperations,
      countervaluesState,
      userCounterValueCurrency,
    ],
  );

  return useMemo(
    () =>
      buildHistoryOperationItems(
        rootAccounts,
        lastSeenOperationDate,
        currenciesSettings,
        filterOperation,
      ),
    [rootAccounts, filterOperation, currenciesSettings, lastSeenOperationDate],
  );
}
