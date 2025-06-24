import { useMemo } from "react";
import { groupAddAccounts } from "@ledgerhq/live-wallet/addAccounts";
import { Account } from "@ledgerhq/types-live";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";

export const useAccountGrouping = ({
  scannedAccounts,
  scanning,
  showAllCreatedAccounts,
}: {
  scannedAccounts: Account[];
  scanning: boolean;
  showAllCreatedAccounts: boolean;
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

  return { sections, alreadyEmptyAccount, newAccountSchemes };
};
