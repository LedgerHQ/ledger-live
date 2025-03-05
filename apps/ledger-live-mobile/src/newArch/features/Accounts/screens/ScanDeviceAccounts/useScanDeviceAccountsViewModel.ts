import { useNavigation, useRoute } from "@react-navigation/core";
import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { concat, from, Subscription } from "rxjs";
import { ignoreElements } from "rxjs/operators";
import { useDispatch } from "react-redux";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import uniq from "lodash/uniq";
import type { Account } from "@ledgerhq/types-live";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import logger from "~/logger";
import { NavigatorName, ScreenName } from "~/const";
import { prepareCurrency } from "~/bridge/cache";
import noAssociatedAccountsByFamily from "~/generated/NoAssociatedAccounts";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { groupAddAccounts } from "@ledgerhq/live-wallet/addAccounts";
import { useMaybeAccountName } from "~/reducers/wallet";
import { setAccountName } from "@ledgerhq/live-wallet/store";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import type { ScanDeviceAccountsNavigationProps, ScanDeviceAccountsViewModelProps } from "./types";
import { track } from "~/analytics";

export default function useScanDeviceAccountsViewModel({
  existingAccounts,
  blacklistedTokenIds,
  analyticsMetadata,
}: ScanDeviceAccountsViewModelProps) {
  const [scanning, setScanning] = useState(true);
  const navigation = useNavigation<ScanDeviceAccountsNavigationProps["navigation"]>();
  const [error, setError] = useState(null);
  const [latestScannedAccount, setLatestScannedAccount] = useState<Account | null>(null);
  const [scannedAccounts, setScannedAccounts] = useState<Account[]>([]);
  const [onlyNewAccounts, setOnlyNewAccounts] = useState(true);
  const [showAllCreatedAccounts, setShowAllCreatedAccounts] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cancelled, setCancelled] = useState(false);
  const scanSubscription = useRef<Subscription | null>(null);
  const [isAddingAccounts, setIsAddinAccounts] = useState<boolean>(false);
  const dispatch = useDispatch();

  const route = useRoute<ScanDeviceAccountsNavigationProps["route"]>();
  const {
    currency,
    device: { deviceId },
    inline,
    returnToSwap,
    onCloseNavigation,
    context,
  } = route.params || {};

  const newAccountSchemes = useMemo(() => {
    // Find accounts that are (scanned && !existing && !used)
    const accountSchemes = scannedAccounts
      ?.filter(a1 => !existingAccounts.map(a2 => a2.id).includes(a1.id) && !a1.used)
      .map(a => a.derivationMode);

    // Make sure to return a list of unique derivationModes (i.e: avoid duplicates)
    return [...new Set(accountSchemes)];
  }, [existingAccounts, scannedAccounts]);

  const preferredNewAccountScheme = useMemo(
    () => (newAccountSchemes && newAccountSchemes.length > 0 ? newAccountSchemes[0] : undefined),
    [newAccountSchemes],
  );
  const startSubscription = useCallback(() => {
    const cryptoCurrency = isTokenCurrency(currency) ? currency.parentCurrency : currency;
    const bridge = getCurrencyBridge(cryptoCurrency);
    const syncConfig = {
      paginationConfig: {
        operations: 0,
      },
      blacklistedTokenIds,
    };
    // will be set to false if an existing account is found
    scanSubscription.current = concat(
      from(prepareCurrency(cryptoCurrency)).pipe(ignoreElements()),
      bridge.scanAccounts({
        currency: cryptoCurrency,
        deviceId,
        syncConfig,
      }),
    ).subscribe({
      next: ({ account }) => {
        setLatestScannedAccount(account);
      },
      complete: () => setScanning(false),
      error: error => {
        logger.critical(error);
        setError(error);
      },
    });
  }, [blacklistedTokenIds, currency, deviceId]);
  const restartSubscription = useCallback(() => {
    setScanning(true);
    setScannedAccounts([]);
    setSelectedIds([]);
    setError(null);
    setCancelled(false);
    startSubscription();
  }, [startSubscription]);
  const stopSubscription = useCallback(
    (syncUI = true) => {
      if (scanSubscription.current) {
        scanSubscription.current.unsubscribe();
        scanSubscription.current = null;

        if (syncUI) {
          setScanning(false);
          const stopScanMetadata = analyticsMetadata?.ScanDeviceAccounts?.onStopScan;
          if (stopScanMetadata)
            track(stopScanMetadata.eventName, {
              ...stopScanMetadata.payload,
            });
        }
      }
    },
    [analyticsMetadata?.ScanDeviceAccounts?.onStopScan],
  );

  const quitFlow = useCallback(() => {
    navigation.navigate(NavigatorName.Accounts);
  }, [navigation]);
  const onPressAccount = useCallback(
    (account: Account) => {
      const isChecked = selectedIds.indexOf(account.id) > -1;
      const newSelectedIds = isChecked
        ? selectedIds.filter(id => id !== account.id)
        : [...selectedIds, account.id];
      setSelectedIds(newSelectedIds);
    },
    [selectedIds],
  );
  const selectAll = useCallback(
    (accounts: Account[], autoSelect?: boolean) => {
      setSelectedIds(uniq([...selectedIds, ...accounts.map(a => a.id)]));
      const selectAllMetadata = analyticsMetadata?.AccountsFound?.onSelectAll;
      if (selectAllMetadata && !autoSelect)
        track(selectAllMetadata.eventName, {
          ...selectAllMetadata.payload,
        });
    },
    [selectedIds, analyticsMetadata?.AccountsFound?.onSelectAll],
  );
  const unselectAll = useCallback(
    (accounts: Account[]) => {
      setSelectedIds(selectedIds.filter(id => !accounts.find(a => a.id === id)));
    },
    [selectedIds],
  );
  const importAccounts = useCallback(() => {
    setIsAddinAccounts(true);
    const accountsToAdd = scannedAccounts.filter(a => selectedIds.includes(a.id));

    dispatch(
      addAccountsAction({
        existingAccounts,
        scannedAccounts,
        selectedIds,
        renamings: {}, // renaming was done in scannedAccounts directly.. (see if we want later to change this paradigm)
      }),
    );
    const { onSuccess } = route.params;

    if (inline) {
      navigation.goBack();
      if (onSuccess) {
        onSuccess({
          scannedAccounts,
          selected: accountsToAdd,
        });
      }
    } else
      navigation.replace(ScreenName.AddAccountsSuccess, {
        ...route.params,
        currency,
        accountsToAdd: accountsToAdd,
      });

    const continueMetadata = analyticsMetadata?.AccountsFound?.onContinue;
    if (continueMetadata)
      track(continueMetadata.eventName, {
        ...continueMetadata.payload,
      });

    const successMetadata = analyticsMetadata?.AccountsFound?.onAccountsAdded;
    if (successMetadata)
      track(successMetadata.eventName, {
        ...successMetadata.payload,
        currency,
        amount: accountsToAdd.length,
      });
  }, [
    currency,
    inline,
    navigation,
    existingAccounts,
    route.params,
    scannedAccounts,
    selectedIds,
    dispatch,
    analyticsMetadata?.AccountsFound?.onContinue,
    analyticsMetadata?.AccountsFound?.onAccountsAdded,
  ]);

  const onCancel = useCallback(() => {
    setError(null);
    setCancelled(true);
  }, []);
  const onModalHide = useCallback(() => {
    if (cancelled) {
      navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
    }
  }, [cancelled, navigation]);
  const viewAllCreatedAccounts = useCallback(() => setShowAllCreatedAccounts(true), []);

  const onAccountNameChange = useCallback(
    (name: string, changedAccount: Account) => {
      dispatch(setAccountName(changedAccount.id, name));
    },
    [dispatch],
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
  const cantCreateAccount = !sections.some(s => s.id === "creatable");
  const noImportableAccounts = !sections.some(
    s => s.id === "importable" || s.id === "creatable" || s.id === "migrate",
  );
  // We don't show already imported accounts in the UI
  const sanitizedSections = sections.filter(s => s.id !== "imported");
  const hasImportableAccounts = sections.find(s => s.id === "importable" && s.data.length > 0);

  const CustomNoAssociatedAccounts =
    currency.type === "CryptoCurrency"
      ? noAssociatedAccountsByFamily[currency.family as keyof typeof noAssociatedAccountsByFamily]
      : null;
  useEffect(() => {
    startSubscription();
    return () => stopSubscription(false);
  }, [startSubscription, stopSubscription]);

  useEffect(() => {
    if (latestScannedAccount) {
      const hasAlreadyBeenScanned = scannedAccounts.some(a => latestScannedAccount.id === a.id);
      const hasAlreadyBeenImported = existingAccounts.some(a => latestScannedAccount.id === a.id);
      const isNewAccount = isAccountEmpty(latestScannedAccount);

      if (!isNewAccount && !hasAlreadyBeenImported) {
        setOnlyNewAccounts(false);
      }

      if (!hasAlreadyBeenScanned) {
        setScannedAccounts([...scannedAccounts, latestScannedAccount]);
        setSelectedIds(
          onlyNewAccounts
            ? hasAlreadyBeenImported || selectedIds.length > 0
              ? selectedIds
              : [latestScannedAccount.id]
            : !hasAlreadyBeenImported && !isNewAccount
              ? uniq([...selectedIds, latestScannedAccount.id])
              : selectedIds,
        );
      }
    }
  }, [existingAccounts, latestScannedAccount, onlyNewAccounts, scannedAccounts, selectedIds]);

  useEffect(() => {
    if (!cantCreateAccount && !isAddingAccounts && !scanning) {
      if (alreadyEmptyAccount && !hasImportableAccounts) {
        navigation.replace(ScreenName.AddAccountsWarning, {
          emptyAccount: alreadyEmptyAccount,
          emptyAccountName: alreadyEmptyAccountName,
          currency,
          context,
        });
      } else if (!scannedAccounts.length && CustomNoAssociatedAccounts) {
        navigation.replace(ScreenName.NoAssociatedAccounts, {
          CustomNoAssociatedAccounts,
        });
      }
    }
  }, [
    hasImportableAccounts,
    cantCreateAccount,
    isAddingAccounts,
    alreadyEmptyAccount,
    alreadyEmptyAccountName,
    scanning,
    navigation,
    currency,
    CustomNoAssociatedAccounts,
    scannedAccounts,
    context,
  ]);
  return {
    alreadyEmptyAccount,
    alreadyEmptyAccountName,
    cantCreateAccount,
    CustomNoAssociatedAccounts,
    error,
    importAccounts,
    newAccountSchemes,
    noImportableAccounts,
    onAccountNameChange,
    onCancel,
    onModalHide,
    onPressAccount,
    quitFlow,
    restartSubscription,
    scannedAccounts,
    scanning,
    sections: sanitizedSections,
    selectAll,
    selectedIds,
    showAllCreatedAccounts,
    stopSubscription,
    unselectAll,
    viewAllCreatedAccounts,
    returnToSwap,
    currency,
    onCloseNavigation,
  };
}
