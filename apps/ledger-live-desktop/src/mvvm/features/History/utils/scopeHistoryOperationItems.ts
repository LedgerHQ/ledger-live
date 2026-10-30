import type { Contact } from "@domain/entity-contact";
import type { OperationTableItem } from "../types";
import { filterOperationTableItemsByAllowedAccountIds } from "./accountScopeForHistory";
import { filterOperationTableItemsByContact } from "./contactScopeForHistory";

export function scopeHistoryOperationItems(
  items: OperationTableItem[],
  operationAccountIds: ReadonlySet<string> | null,
  contact?: Contact,
): OperationTableItem[] {
  const accountScopedItems = operationAccountIds
    ? filterOperationTableItemsByAllowedAccountIds(items, operationAccountIds)
    : items;
  return contact
    ? filterOperationTableItemsByContact(accountScopedItems, contact)
    : accountScopedItems;
}
