import { Account } from "@ledgerhq/types-live";

export const getToggledIds = (selectedIds: string[], accountId: string) => {
  const isChecked = selectedIds.includes(accountId);
  return isChecked ? selectedIds.filter(id => id !== accountId) : [...selectedIds, accountId];
};

export const selectImportable = (selected: string[], importable: Account[]) => {
  const importableIds = importable.map(a => a.id);
  return [...new Set([...selected, ...importableIds])];
};

export const deselectImportable = (selected: string[], importable: Account[]) => {
  const importableIds = new Set(importable.map(a => a.id));
  return selected.filter(id => !importableIds.has(id));
};
