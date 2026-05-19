import { useMemo, useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { selectFeature } from "@shared/feature-flags";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { isAddressPoisoningOperation } from "@ledgerhq/ledger-wallet-framework/operation";
import { filterTokenOperationsZeroAmountSelector } from "~/renderer/reducers/settings";
import {
  buildHistoryOperationItems,
  getAddressPoisoningFamiliesForFilter,
} from "../utils/historyOperationItems";
import { lastSeenOperationDateSelector } from "~/renderer/reducers/history";
import type { State } from "~/renderer/reducers";
import type { OperationTableItem } from "../types";

/** Same pipeline as the full History list, limited to the given root portfolio accounts. */
export function useHistoryOperationItemsForRootAccounts(
  rootAccounts: Account[],
): OperationTableItem[] {
  const currenciesSettings = useSelector((state: State) => state.settings.currenciesSettings);
  const lastSeenOperationDate = useSelector(lastSeenOperationDateSelector);
  const shouldFilterTokenOps = useSelector(filterTokenOperationsZeroAmountSelector);
  const poisoningFeature = useSelector((state: State) =>
    selectFeature(state, "addressPoisoningOperationsFilter"),
  );

  const addressPoisoningFamilies = useMemo(
    () => getAddressPoisoningFamiliesForFilter(shouldFilterTokenOps, poisoningFeature),
    [shouldFilterTokenOps, poisoningFeature],
  );

  const filterOperation = useCallback(
    (operation: Operation, account: AccountLike) => {
      if (!shouldFilterTokenOps) return true;
      return !isAddressPoisoningOperation(
        operation,
        account,
        addressPoisoningFamilies ? { families: addressPoisoningFamilies } : undefined,
      );
    },
    [shouldFilterTokenOps, addressPoisoningFamilies],
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
