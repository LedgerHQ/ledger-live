import { useNavigation, useRoute } from "@react-navigation/core";
import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { concat, from, Subscription } from "rxjs";
import { ignoreElements } from "rxjs/operators";
import { useDispatch } from "~/context/hooks";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import uniq from "lodash/uniq";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
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
import { isCantonAccount } from "@ledgerhq/coin-canton/bridge/serialization";
import type { ScanDeviceAccountsNavigationProps, ScanDeviceAccountsViewModelProps } from "./types";
import { track } from "~/analytics";

const isNoAssociatedAccountsFamily = (
  family: string,
): family is keyof typeof noAssociatedAccountsByFamily =>
  Object.prototype.hasOwnProperty.call(noAssociatedAccountsByFamily, family);

const getCustomNoAssociatedAccounts = (currency: CryptoOrTokenCurrency) => {
  if (currency.type !== "CryptoCurrency") return null;
  if (!isNoAssociatedAccountsFamily(currency.family)) return null;
  return noAssociatedAccountsByFamily[currency.family];
};

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
  const cancelledRef = useRef(false);
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
    navigationDepth,
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
    cancelledRef.current = false;
    startSubscription();
  }, [startSubscription]);

  const handleRetry = useCallback(() => {
    // In inline flows (e.g., Receive), navigate back to device selection
    // to allow user to reconnect/unlock device instead of retrying on same screen
    if (inline && error) {
      // Simply go back to SelectDevice which is already in the stack
      navigation.goBack();
      return;
    }

    restartSubscription();
  }, [inline, error, navigation, restartSubscription]);
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
    navigation.navigate(NavigatorName.Accounts, {
      screen: ScreenName.AccountsList,
      params: {
        sourceScreenName: ScreenName.ScanDeviceAccounts,
        showHeader: true,
        canAddAccount: false,
        isSyncEnabled: false,
        specificAccounts: scannedAccounts,
      },
    });
  }, [navigation, scannedAccounts]);
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

  // Close inline flow: drawer + navigation
  const closeInlineFlow = useCallback(() => {
    if (onCloseNavigation) {
      onCloseNavigation();
    }
    const parent = navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
    parent?.pop(navigationDepth ?? 2);
  }, [navigation, onCloseNavigation, navigationDepth]);

  const importAccounts = useCallback(() => {
    const accountsToAdd = scannedAccounts.filter(a => selectedIds.includes(a.id));

    if (currency.id.includes("canton_network")) {
      const accountsNeedingOnboarding = accountsToAdd.filter(account => {
        if (isCantonAccount(account)) {
          return !account.cantonResources.isOnboarded;
        }
        return true;
      });

      if (accountsNeedingOnboarding.length > 0) {
        navigation.replace(NavigatorName.CantonOnboard, {
          screen: ScreenName.CantonOnboardAccount,
          params: { accountsToAdd: accountsToAdd, currency },
        });
        return;
      }
    }

    setIsAddinAccounts(true);

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
      closeInlineFlow();

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
        currency: currency.name,
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
    closeInlineFlow,
    analyticsMetadata?.AccountsFound?.onContinue,
    analyticsMetadata?.AccountsFound?.onAccountsAdded,
  ]);

  const onCancel = useCallback(() => {
    setError(null);
    cancelledRef.current = true;
  }, []);

  const onModalHide = useCallback(() => {
    // Use ref to avoid stale closure issue with cancelled state
    if (cancelledRef.current) {
      if (inline) {
        closeInlineFlow();
      } else {
        navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()?.pop();
      }
    }
  }, [inline, closeInlineFlow, navigation]);

  const viewAllCreatedAccounts = useCallback(() => setShowAllCreatedAccounts(true), []);

  const onAccountNameChange = useCallback(
    (name: string, changedAccount: Account) => {
      dispatch(setAccountName(changedAccount.id, name));
    },
    [dispatch],
  );
  const preferredNewAccountSchemes = useMemo(
    () =>
      showAllCreatedAccounts || !preferredNewAccountScheme
        ? undefined
        : [preferredNewAccountScheme],
    [preferredNewAccountScheme, showAllCreatedAccounts],
  );

  const { sections, alreadyEmptyAccount } = useMemo(
    () =>
      groupAddAccounts(existingAccounts, scannedAccounts, {
        scanning,
        preferredNewAccountSchemes,
      }),
    [existingAccounts, scannedAccounts, scanning, preferredNewAccountSchemes],
  );
  const alreadyEmptyAccountName = useMaybeAccountName(alreadyEmptyAccount);
  const cantCreateAccount = !sections.some(s => s.id === "creatable" && s.data.length > 0);
  const noImportableAccounts = !sections.some(
    s => (s.id === "importable" || s.id === "creatable" || s.id === "migrate") && s.data.length > 0,
  );
  // We don't show already imported accounts in the UI
  const sanitizedSections = sections.filter(s => s.id !== "imported");
  const hasImportableAccounts = sections.find(s => s.id === "importable" && s.data.length > 0);

  const CustomNoAssociatedAccounts = getCustomNoAssociatedAccounts(currency);
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
    const hasScannedAccounts = scannedAccounts.length > 0 || !!latestScannedAccount;

    if (!isAddingAccounts && !scanning) {
      if (alreadyEmptyAccount && !hasImportableAccounts) {
        navigation.replace(ScreenName.AddAccountsWarning, {
          emptyAccount: alreadyEmptyAccount,
          emptyAccountName: alreadyEmptyAccountName,
          currency,
          context,
          onCloseNavigation,
        });
      } else if (!hasScannedAccounts && CustomNoAssociatedAccounts) {
        navigation.replace(ScreenName.NoAssociatedAccounts, {
          CustomNoAssociatedAccounts,
        });
      }
    }
  }, [
    hasImportableAccounts,
    isAddingAccounts,
    alreadyEmptyAccount,
    alreadyEmptyAccountName,
    scanning,
    navigation,
    currency,
    CustomNoAssociatedAccounts,
    context,
    onCloseNavigation,
    scannedAccounts.length,
    latestScannedAccount,
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
    handleRetry,
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
