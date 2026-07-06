import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { selectFeature } from "@shared/feature-flags";
import type { Account } from "@ledgerhq/types-live";
import { filterTokenOperationsZeroAmountSelector } from "~/renderer/reducers/settings";
import {
  buildHistoryOperationItems,
  buildHistoryOperationFilter,
  getAddressPoisoningFamiliesForFilter,
} from "../utils/historyOperationItems";
import {
  historyDustFilterOptionsSelector,
  lastSeenOperationDateSelector,
} from "~/renderer/reducers/history";
import type { State } from "~/renderer/reducers";
import type { OperationTableItem } from "../types";

/** Same pipeline as the full History list, limited to the given root portfolio accounts. */
export function useHistoryOperationItemsForRootAccounts(
  rootAccounts: Account[],
): OperationTableItem[] {
  const currenciesSettings = useSelector((state: State) => state.settings.currenciesSettings);
  const lastSeenOperationDate = useSelector(lastSeenOperationDateSelector);
  const shouldFilterTokenOps = useSelector(filterTokenOperationsZeroAmountSelector);
  const dustFilterOptions = useSelector(historyDustFilterOptionsSelector);
  const poisoningFeature = useSelector((state: State) =>
    selectFeature(state, "addressPoisoningOperationsFilter"),
  );

  const addressPoisoningFamilies = useMemo(
    () => getAddressPoisoningFamiliesForFilter(shouldFilterTokenOps, poisoningFeature),
    [shouldFilterTokenOps, poisoningFeature],
  );

  const filterOperation = useMemo(
    () =>
      buildHistoryOperationFilter({
        shouldFilterTokenOps,
        addressPoisoningFamilies,
        ...dustFilterOptions,
      }),
    [shouldFilterTokenOps, addressPoisoningFamilies, dustFilterOptions],
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
