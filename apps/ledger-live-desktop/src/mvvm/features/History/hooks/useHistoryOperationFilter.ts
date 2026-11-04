import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { selectFeature } from "@shared/feature-flags";
import { filterTokenOperationsZeroAmountSelector } from "~/renderer/reducers/settings";
import {
  buildHistoryOperationFilter,
  getAddressPoisoningFamiliesForFilter,
} from "../utils/historyOperationItems";
import { historyDustFilterOptionsSelector } from "~/renderer/reducers/history";
import type { State } from "~/renderer/reducers";

export function useHistoryOperationFilter() {
  const shouldFilterTokenOps = useSelector(filterTokenOperationsZeroAmountSelector);
  const dustFilterOptions = useSelector(historyDustFilterOptionsSelector);
  const poisoningFeature = useSelector((state: State) =>
    selectFeature(state, "addressPoisoningOperationsFilter"),
  );

  const addressPoisoningFamilies = useMemo(
    () => getAddressPoisoningFamiliesForFilter(shouldFilterTokenOps, poisoningFeature),
    [shouldFilterTokenOps, poisoningFeature],
  );

  return useMemo(
    () =>
      buildHistoryOperationFilter({
        shouldFilterTokenOps,
        addressPoisoningFamilies,
        ...dustFilterOptions,
      }),
    [shouldFilterTokenOps, addressPoisoningFamilies, dustFilterOptions],
  );
}
