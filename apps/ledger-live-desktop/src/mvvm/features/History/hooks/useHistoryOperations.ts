import { useMemo } from "react";
import type { Contact } from "@domain/entity-contact";
import type { OperationTableItem } from "../types";
import { scopeHistoryOperationItems } from "../utils/scopeHistoryOperationItems";
import { useHistoryAccountScope } from "./useHistoryAccountScope";
import { useHistoryContact } from "./useHistoryContact";
import { useHistoryOperationItemsForRootAccounts } from "./useHistoryOperationItemsForRootAccounts";

export function useHistoryOperations(contact?: Contact): OperationTableItem[] {
  const routeContact = useHistoryContact();
  const activeContact = contact ?? routeContact;
  const { rootAccounts, operationAccountIds } = useHistoryAccountScope();
  const baseOperationItems = useHistoryOperationItemsForRootAccounts(rootAccounts);

  return useMemo(
    () => scopeHistoryOperationItems(baseOperationItems, operationAccountIds, activeContact),
    [activeContact, baseOperationItems, operationAccountIds],
  );
}
