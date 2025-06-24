import { Account } from "@ledgerhq/types-live";
import { useCallback, useEffect, useState } from "react";
import { WARNING_REASON, WarningReason } from "../../../types";
import { useImportedAccounts } from "./useImportedAccounts";
import { useSelector } from "react-redux";
import { useSubscription } from "./useSubscription";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getLLDCoinFamily } from "~/renderer/families";
import { useAccountGrouping } from "./useAccountGrouping";
import { useAccounts } from "./useAccounts";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { isAccountEmpty } from "@ledgerhq/coin-framework/lib-es/account/helpers";

export const useScanAccounts = ({
  currency,
  deviceId,
  onComplete,
  navigateToWarningScreen,
}: {
  currency: CryptoCurrency;
  deviceId: string;
  onComplete: (accounts: Account[]) => void;
  navigateToWarningScreen: (reason: WarningReason, account?: Account) => void;
}) => {
  const existingAccounts = useSelector(accountsSelector);

  const { error, stopSubscription, scanning, latestScannedAccount } = useSubscription({
    currency,
    deviceId,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scannedAccounts, setScannedAccounts] = useState<Account[]>([]);
  const [onlyNewAccounts, setOnlyNewAccounts] = useState(true);

  useEffect(() => {
    if (!latestScannedAccount) return;

    const isNewAccount = isAccountEmpty(latestScannedAccount);

    if (!isNewAccount) {
      setOnlyNewAccounts(false);
    }

    const hasAlreadyBeenScanned = scannedAccounts.some(a => latestScannedAccount.id === a.id);

    if (!hasAlreadyBeenScanned) {
      setScannedAccounts(prev => [...prev, latestScannedAccount]);

      const hasAlreadyBeenImported = existingAccounts.some(a => latestScannedAccount.id === a.id);
      if (hasAlreadyBeenImported) return;

      setSelectedIds(prev => {
        if (onlyNewAccounts) return prev.length ? prev : [latestScannedAccount.id];
        if (isNewAccount) return prev;
        return Array.from(new Set([...prev, latestScannedAccount.id]));
      });
    }
  }, [existingAccounts, latestScannedAccount, onlyNewAccounts, scannedAccounts]);

  const [showAllCreatedAccounts, setShowAllCreatedAccounts] = useState(false);

  const toggleShowAllCreatedAccounts = useCallback(
    () => setShowAllCreatedAccounts(prevState => !prevState),
    [],
  );

  const { sections, alreadyEmptyAccount, newAccountSchemes } = useAccountGrouping({
    scannedAccounts,
    scanning,
    showAllCreatedAccounts,
  });

  const { allImportableAccountsSelected, importableAccounts, creatableAccounts } = useAccounts({
    sections,
    selectedIds,
  });

  const handleToggle = useCallback((accountId: string) => {
    setSelectedIds(prev =>
      prev.includes(accountId) ? prev.filter(id => id !== accountId) : [...prev, accountId],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const importableAccountIds = importableAccounts.map(a => a.id);
    setSelectedIds(prevSelectedIds => {
      return [...new Set([...prevSelectedIds, ...importableAccountIds])];
    });
  }, [importableAccounts]);

  const handleDeselectAll = useCallback(() => {
    const importableAccountIds = importableAccounts.map(a => a.id);
    setSelectedIds(prevSelectedIds => {
      return prevSelectedIds.filter(id => !importableAccountIds.includes(id));
    });
  }, [importableAccounts]);

  const { hasImportedAccounts, handleConfirm } = useImportedAccounts({
    onComplete,
    selectedIds,
    scannedAccounts,
  });

  useEffect(() => {
    if (scanning || hasImportedAccounts) return;

    if (alreadyEmptyAccount && !importableAccounts.length && selectedIds.length === 0) {
      navigateToWarningScreen(WARNING_REASON.ALREADY_EMPTY_ACCOUNT, alreadyEmptyAccount);
      return;
    }

    if (!creatableAccounts.length || !importableAccounts.length) {
      if (
        currency.type === "CryptoCurrency" &&
        getLLDCoinFamily(currency.family).NoAssociatedAccounts
      ) {
        navigateToWarningScreen(WARNING_REASON.NO_ASSOCIATED_ACCOUNTS);
      }
    }
  }, [
    alreadyEmptyAccount,
    scanning,
    currency,
    creatableAccounts.length,
    importableAccounts.length,
    navigateToWarningScreen,
    hasImportedAccounts,
    selectedIds.length,
  ]);

  return {
    error,
    stopSubscription,
    toggleShowAllCreatedAccounts,
    newAccountSchemes,
    allImportableAccountsSelected,
    selectedIds,
    handleToggle,
    scanning,
    importableAccounts,
    handleSelectAll,
    handleDeselectAll,
    creatableAccounts,
    showAllCreatedAccounts,
    handleConfirm,
  };
};
