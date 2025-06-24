import { useMemo } from "react";
import { groupAddAccounts } from "@ledgerhq/live-wallet/addAccounts";
import { Account } from "@ledgerhq/types-live";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";

export const useAccounts = ({
  scannedAccounts,
  scanning,
  showAllCreatedAccounts,
  selectedIds,
}: {
  scannedAccounts: Account[];
  scanning: boolean;
  showAllCreatedAccounts: boolean;
  selectedIds: string[];
}) => {
  const existingAccounts = useSelector(accountsSelector);

  const newAccountSchemes = useMemo(() => {
    const accountSchemes = scannedAccounts
      .filter(a1 => !existingAccounts.map(a2 => a2.id).includes(a1.id) && !a1.used)
      .map(a => a.derivationMode);

    return [...new Set(accountSchemes)];
  }, [existingAccounts, scannedAccounts]);

  const preferredNewAccountScheme = useMemo(
    () => (newAccountSchemes && newAccountSchemes.length > 0 ? newAccountSchemes[0] : undefined),
    [newAccountSchemes],
  );

  const { sections, alreadyEmptyAccount } = useMemo(
    () =>
      groupAddAccounts(existingAccounts, scannedAccounts, {
        scanning,
        preferredNewAccountSchemes: showAllCreatedAccounts
          ? undefined
          : [preferredNewAccountScheme!],
      }),
    [
      existingAccounts,
      scannedAccounts,
      scanning,
      showAllCreatedAccounts,
      preferredNewAccountScheme,
    ],
  );

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
    alreadyEmptyAccount,
    newAccountSchemes,
  };
};
