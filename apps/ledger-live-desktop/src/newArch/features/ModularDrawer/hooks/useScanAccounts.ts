import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { Account } from "@ledgerhq/types-live";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { addAccountsAction, groupAddAccounts } from "@ledgerhq/live-wallet/addAccounts";
import { Subscription } from "rxjs";
import { WARNING_REASON, WarningReason } from "../types";
import { getLLDCoinFamily } from "~/renderer/families";

export type UseScanAccountsProps = {
  currency: CryptoCurrency;
  deviceId: string;
  onComplete: (accounts: Account[]) => void;
  navigateToWarningScreen: (reason: WarningReason, account?: Account) => void;
};

export function useScanAccounts({
  currency,
  deviceId,
  onComplete,
  navigateToWarningScreen,
}: UseScanAccountsProps) {
  const existingAccounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const [latestScannedAccount, setLatestScannedAccount] = useState<Account | null>(null);
  const [scannedAccounts, setScannedAccounts] = useState<Account[]>([]);
  const [onlyNewAccounts, setOnlyNewAccounts] = useState(true);
  const [showAllCreatedAccounts, setShowAllCreatedAccounts] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hasImportedAccounts, setHasImportedAccounts] = useState(false);
  const scanSubscription = useRef<Subscription | null>(null);

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

  const startSubscription = useCallback(() => {
    const bridge = getCurrencyBridge(currency);
    const syncConfig = {
      paginationConfig: {
        operations: 0,
      },
      blacklistedTokenIds: blacklistedTokenIds || [],
    };

    scanSubscription.current = bridge
      .scanAccounts({
        currency: currency,
        deviceId,
        syncConfig,
      })
      .subscribe({
        next: ({ account }) => {
          setLatestScannedAccount(account);
        },
        complete: () => setScanning(false),
        error: error => {
          setError(error);
        },
      });
  }, [blacklistedTokenIds, currency, deviceId]);

  const stopSubscription = useCallback((syncUI = true) => {
    if (scanSubscription.current) {
      scanSubscription.current.unsubscribe();
      scanSubscription.current = null;

      if (syncUI) {
        setScanning(false);
      }
    }
  }, []);

  const handleConfirm = useCallback(() => {
    const accountsToImport = scannedAccounts.filter(a => selectedIds.includes(a.id));
    if (accountsToImport.length > 0) {
      setHasImportedAccounts(true);
    }
    dispatch(
      addAccountsAction({
        existingAccounts,
        scannedAccounts,
        selectedIds,
        renamings: {},
      }),
    );
    onComplete(scannedAccounts.filter(a => selectedIds.includes(a.id)));
  }, [dispatch, existingAccounts, scannedAccounts, selectedIds, onComplete]);

  const toggleShowAllCreatedAccounts = useCallback(
    () => setShowAllCreatedAccounts(prevState => !prevState),
    [],
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

  const alreadyEmptyAccountName = useMaybeAccountName(alreadyEmptyAccount);

  const CustomNoAssociatedAccounts =
    currency.type === "CryptoCurrency"
      ? getLLDCoinFamily(currency.family).NoAssociatedAccounts
      : null;

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

  const handleToggle = useCallback(
    (accountId: string) => {
      const isChecked = selectedIds.indexOf(accountId) > -1;
      const newSelectedIds = isChecked
        ? selectedIds.filter(id => id !== accountId)
        : [...selectedIds, accountId];
      setSelectedIds(newSelectedIds);
    },
    [selectedIds],
  );

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

  useEffect(() => {
    startSubscription();
    return () => stopSubscription(false);
  }, [startSubscription, stopSubscription]);

  useEffect(() => {
    if (latestScannedAccount) {
      const hasAlreadyBeenScanned = scannedAccounts.some(a => latestScannedAccount.id === a.id);
      const hasAlreadyBeenImported = existingAccounts.some(a => latestScannedAccount.id === a.id);
      const isNewAccount = isAccountEmpty(latestScannedAccount);

      if (!isNewAccount) {
        setOnlyNewAccounts(false);
      }

      if (!hasAlreadyBeenScanned) {
        setScannedAccounts([...scannedAccounts, latestScannedAccount]);
        if (!hasAlreadyBeenImported) {
          const newAccountsSelected =
            selectedIds.length > 0 ? selectedIds : [latestScannedAccount.id];
          const existingAccountsSelected = !isNewAccount
            ? Array.from(new Set([...selectedIds, latestScannedAccount.id]))
            : selectedIds;
          const selectedAccountIds = onlyNewAccounts
            ? newAccountsSelected
            : existingAccountsSelected;
          setSelectedIds(selectedAccountIds);
        }
      }
    }
  }, [existingAccounts, latestScannedAccount, onlyNewAccounts, scannedAccounts, selectedIds]);

  useEffect(() => {
    if (
      !scanning &&
      alreadyEmptyAccount &&
      !importableAccounts.length &&
      !hasImportedAccounts &&
      selectedIds.length === 0
    ) {
      navigateToWarningScreen(WARNING_REASON.ALREADY_EMPTY_ACCOUNT, alreadyEmptyAccount);
    } else if (
      !scanning &&
      (!creatableAccounts.length || !importableAccounts.length) &&
      CustomNoAssociatedAccounts &&
      !hasImportedAccounts
    ) {
      navigateToWarningScreen(WARNING_REASON.NO_ASSOCIATED_ACCOUNTS);
    }
  }, [
    alreadyEmptyAccount,
    alreadyEmptyAccountName,
    scanning,
    currency,
    CustomNoAssociatedAccounts,
    scannedAccounts,
    creatableAccounts.length,
    importableAccounts.length,
    navigateToWarningScreen,
    hasImportedAccounts,
    selectedIds.length,
  ]);

  return {
    error,
    newAccountSchemes,
    allImportableAccountsSelected,
    stopSubscription,
    scanning,
    importableAccounts,
    creatableAccounts,
    handleToggle,
    handleSelectAll,
    handleDeselectAll,
    handleConfirm,
    selectedIds,
    showAllCreatedAccounts,
    toggleShowAllCreatedAccounts,
  };
}
