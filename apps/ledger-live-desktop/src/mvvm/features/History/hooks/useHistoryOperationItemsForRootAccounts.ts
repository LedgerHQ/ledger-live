import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import type { Account } from "@ledgerhq/types-live";
import { lastSeenOperationDateSelector } from "~/renderer/reducers/history";
import type { State } from "~/renderer/reducers";
import type { OperationTableItem } from "../types";
import { buildHistoryOperationItems } from "../utils/historyOperationItems";
import { useHistoryOperationFilter } from "./useHistoryOperationFilter";

/** Same pipeline as the full History list, limited to the given root portfolio accounts. */
export function useHistoryOperationItemsForRootAccounts(
  rootAccounts: Account[],
): OperationTableItem[] {
  const currenciesSettings = useSelector((state: State) => state.settings.currenciesSettings);
  const lastSeenOperationDate = useSelector(lastSeenOperationDateSelector);
  const filterOperation = useHistoryOperationFilter();

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
