import { useMemo } from "react";
import { selectAccountDataStatus } from "@domain/entity-account-data";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { lastSeenOperationDateSelector } from "~/renderer/reducers/history";
import type { State } from "~/renderer/reducers";
import type { OperationTableItem } from "../types";
import {
  compareOperationTableItems,
  toAccountDataOperationItems,
} from "../utils/accountDataOperationItems";
import { parseLastSeenMs } from "../utils/historyOperationItems";
import { useAccountDataTargets, type AccountDataTarget } from "./useAccountDataTargets";
import { useHistoryOperationFilter } from "./useHistoryOperationFilter";

export function useAccountDataOperationItems(rootAccounts: Account[]): {
  items: OperationTableItem[];
  targets: AccountDataTarget[];
  pending: boolean;
} {
  const accountOperations = useSelector((state: State) => state.accountOperations);
  const lastSeenTs = parseLastSeenMs(useSelector(lastSeenOperationDateSelector));
  const filterOperation = useHistoryOperationFilter();
  const targets = useAccountDataTargets(rootAccounts);
  const pending = useSelector((state: State) =>
    targets.some(target => {
      const stored = state.accountOperations[target.accountUUID];
      if ((stored?.length ?? 0) > 0) return false;
      const status = selectAccountDataStatus(state, "operations", target.accountUUID);
      if (status?.request) return true;
      return status?.readAt === undefined && status?.error === undefined;
    }),
  );

  const items = useMemo(() => {
    const rows = targets.flatMap(target => {
      const operations = accountOperations[target.accountUUID];
      if (!operations) return [];
      return toAccountDataOperationItems(target.account, operations, lastSeenTs, filterOperation);
    });
    return rows.sort(compareOperationTableItems);
  }, [accountOperations, filterOperation, lastSeenTs, targets]);

  return { items, targets, pending };
}
