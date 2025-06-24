import { AddAccountsSection } from "@ledgerhq/live-wallet/lib-es/addAccounts";
import { useMemo } from "react";

export const useAccounts = ({
  sections,
  selectedIds,
}: {
  sections: AddAccountsSection[];
  selectedIds: string[];
}) => {
  const importableAccounts = useMemo(
    () => sections.find(section => section.id === "importable")?.data || [],
    [sections],
  );
  const creatableAccounts = useMemo(
    () => sections.find(section => section.id === "creatable")?.data || [],
    [sections],
  );

  const allImportableAccountsSelected = useMemo(
    () =>
      importableAccounts.length > 0 &&
      importableAccounts.every(account => selectedIds.includes(account.id)),
    [importableAccounts, selectedIds],
  );

  return {
    allImportableAccountsSelected,
    importableAccounts,
    creatableAccounts,
  };
};
