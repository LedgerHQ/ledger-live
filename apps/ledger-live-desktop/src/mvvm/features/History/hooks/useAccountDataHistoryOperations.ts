import { useMemo } from "react";
import type { OperationTableItem } from "../types";
import { scopeHistoryOperationItems } from "../utils/scopeHistoryOperationItems";
import { useAccountDataOperationItems } from "./useAccountDataOperationItems";
import type { AccountDataTarget } from "./useAccountDataTargets";
import { useHistoryAccountScope } from "./useHistoryAccountScope";
import { useHistoryContact } from "./useHistoryContact";

export function useAccountDataHistoryOperations(): {
  operations: OperationTableItem[];
  targets: AccountDataTarget[];
  pending: boolean;
} {
  const contact = useHistoryContact();
  const { rootAccounts, operationAccountIds } = useHistoryAccountScope();
  const { items, targets, pending } = useAccountDataOperationItems(rootAccounts);
  const operations = useMemo(
    () => scopeHistoryOperationItems(items, operationAccountIds, contact),
    [contact, items, operationAccountIds],
  );

  return { operations, targets, pending };
}
