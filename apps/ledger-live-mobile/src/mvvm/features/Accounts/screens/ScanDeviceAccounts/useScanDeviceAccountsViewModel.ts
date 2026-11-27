import { track } from "@shared/analytics";
import { useNavigation, useRoute } from "@react-navigation/core";
import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { concat, from, Subscription } from "rxjs";
import { ignoreElements, tap } from "rxjs/operators";
import { useDispatch } from "~/context/hooks";
import { openCurrencyRegionRestrictedDrawer } from "~/reducers/currencyRegionRestrictedDrawer";
import { useTranslation } from "~/context/Locale";
import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import uniq from "lodash/uniq";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useCurrencyBridge } from "@ledgerhq/live-common/bridge/useCurrencyBridge";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import logger from "~/logger";
import { NavigatorName, ScreenName } from "~/const";
import { prepareCurrency } from "~/bridge/cache";
import noAssociatedAccountsByFamily from "~/generated/NoAssociatedAccounts";
import { getCustomAddAccountFlow } from "LLM/features/Accounts/utils/customAddAccountFlow";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { groupAddAccounts, addAccountsAction } from "@ledgerhq/live-common/account/addAccounts";
import { useMaybeAccountName, setAccountName } from "~/reducers/wallet";
import { isCantonAccount } from "@ledgerhq/coin-canton/bridge/serialization";
import { isConcordiumAccount } from "@ledgerhq/coin-concordium/bridge/serialization";
import { toErrorAttributes } from "@shared/observability-operations";
import { useOperation } from "@shared/observability-operations-react";
import { ADD_ACCOUNT_OPERATION } from "LLM/features/Accounts/constants";
import { consumeRetryAttempt, markRetryPending } from "./addAccountAttempts";
import type { ScanDeviceAccountsNavigationProps, ScanDeviceAccountsViewModelProps } from "./types";

const toDeviceModelId = (modelId: unknown) => (typeof modelId === "string" ? modelId : undefined);

const toTransport = (wired: unknown) => {
  if (typeof wired !== "boolean") return undefined;
  return wired ? "usb" : "ble";
};

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
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(true);
  const navigation = useNavigation<ScanDeviceAccountsNavigationProps["navigation"]>();
  const [error, setError] = useState<Error | null>(null);
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
    device: { deviceId, modelId, wired },
    inline,
    returnToSwap,
    onCloseNavigation,
    navigationDepth,
    context,
    openedFromRouteKey,
  } = route.params || {};

  const customFlow = getCustomAddAccountFlow(currency);
  const isToken = currency.type === "TokenCurrency";
  const cryptoCurrency = isToken ? getCryptoCurrencyById(currency.parentCurrencyId) : currency;

  const addAccountOperation = useOperation(ADD_ACCOUNT_OPERATION);
  const lastOperationAttempt = useRef(0);
  const operationStartedOnMount = useRef(false);
  const operationStartAttributes = useMemo(
    () => ({
      currency_id: cryptoCurrency.id,
      currency_family: cryptoCurrency.family,
      is_token: isToken,
      device_model_id: toDeviceModelId(modelId),
      transport: toTransport(wired),
      inline: !!inline,
      context,
    }),
    [cryptoCurrency.id, cryptoCurrency.family, isToken, modelId, wired, inline, context],
  );
  const startOperationAttempt = useCallback(() => {
    const started = addAccountOperation.start({
      ...operationStartAttributes,
      attempt: lastOperationAttempt.current + 1,
    });
    if (started) lastOperationAttempt.current += 1;
  }, [addAccountOperation, operationStartAttributes]);

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
  const currencyBridge = useCurrencyBridge(cryptoCurrency);
  const startSubscription = useCallback(() => {
    const syncConfig = {
      paginationConfig: {
        operations: 0,
      },
      blacklistedTokenIds,
    };
    const discoveredAccountIds = new Set<string>();
    addAccountOperation.annotate({ step: "preparing", accounts_scanned: 0 });
    const preparedCurrency = from(prepareCurrency(cryptoCurrency)).pipe(
      ignoreElements(),
      tap({ complete: () => addAccountOperation.annotate({ step: "scanning" }) }),
    );
    scanSubscription.current = concat(
      preparedCurrency,
      currencyBridge.scanAccounts({
        currency: cryptoCurrency,
        deviceId,
        syncConfig,
      }),
    ).subscribe({
      next: ({ account }) => {
        discoveredAccountIds.add(account.id);
        addAccountOperation.annotate({ accounts_scanned: discoveredAccountIds.size });
        setLatestScannedAccount(account);
      },
      complete: () => {
        setScanning(false);
        addAccountOperation.annotate({ step: "selecting" });
      },
      error: error => {
        logger.critical(error);
        setError(error);
        const errorAttributes = toErrorAttributes(error);
        if (errorAttributes.error_name === "CurrencyRegionRestrictedError") {
          addAccountOperation.succeed({ outcome: "region_restricted" });
        } else {
          addAccountOperation.fail("ERROR", errorAttributes);
        }
      },
    });
  }, [blacklistedTokenIds, cryptoCurrency, currencyBridge, deviceId, addAccountOperation]);

  const restartSubscription = useCallback(() => {
    setScanning(true);
    setScannedAccounts([]);
    setSelectedIds([]);
    setError(null);
    cancelledRef.current = false;
    startOperationAttempt();
    startSubscription();
  }, [startOperationAttempt, startSubscription]);

  const handleRetry = useCallback(() => {
    // In inline flows (e.g., Receive), navigate back to device selection
    // to allow user to reconnect/unlock device instead of retrying on same screen
    if (inline && error) {
      markRetryPending({
        currencyId: currency.id,
        context,
        journeyKey: openedFromRouteKey,
        attempt: lastOperationAttempt.current,
      });
      // Simply go back to SelectDevice which is already in the stack
      navigation.goBack();
      return;
    }

    restartSubscription();
  }, [inline, error, navigation, restartSubscription, currency.id, context, openedFromRouteKey]);
  const stopSubscription = useCallback(
    (syncUI = true) => {
      if (scanSubscription.current) {
        scanSubscription.current.unsubscribe();
        scanSubscription.current = null;

        if (syncUI) {
          setScanning(false);
          addAccountOperation.annotate({ step: "selecting", scan_stopped_by_user: true });
          const stopScanMetadata = analyticsMetadata?.ScanDeviceAccounts?.onStopScan;
          if (stopScanMetadata)
            track(stopScanMetadata.eventName, {
              ...stopScanMetadata.payload,
            });
        }
      }
    },
    [addAccountOperation, analyticsMetadata?.ScanDeviceAccounts?.onStopScan],
  );

  const quitFlow = useCallback(() => {
    addAccountOperation.succeed({ outcome: "nothing_to_add" });
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
  }, [navigation, addAccountOperation, scannedAccounts]);
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

  const popInlineScreens = useCallback(() => {
    const parent = navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
    parent?.pop(navigationDepth ?? 2);
  }, [navigation, navigationDepth]);

  const closeInlineFlow = useCallback(() => {
    if (onCloseNavigation) {
      onCloseNavigation();
    }
    popInlineScreens();
  }, [onCloseNavigation, popInlineScreens]);

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
        addAccountOperation.succeed({
          handoff: "canton_onboarding",
          accounts_selected: accountsToAdd.length,
        });
        navigation.replace(ScreenName.CantonOnboardAccount, {
          accountsToAdd: accountsToAdd,
          currency,
        });
        return;
      }
    }

    if (currency.type === "CryptoCurrency" && currency.family === "concordium") {
      const accountsNeedingOnboarding = accountsToAdd.filter(account => {
        if (isConcordiumAccount(account)) {
          return !account.concordiumResources.isOnboarded;
        }
        return true;
      });

      if (accountsNeedingOnboarding.length > 0) {
        addAccountOperation.succeed({
          handoff: "concordium_onboarding",
          accounts_selected: accountsToAdd.length,
        });
        navigation.replace(NavigatorName.ConcordiumOnboard, {
          screen: ScreenName.ConcordiumOnboardAccount,
          params: { accountsToAdd, currency },
        });
        return;
      }
    }

    if (customFlow?.onImportAccounts) {
      const continueMetadata = analyticsMetadata?.AccountsFound?.onContinue;
      if (continueMetadata)
        track(continueMetadata.eventName, {
          ...continueMetadata.payload,
        });

      setIsAddinAccounts(true);
      addAccountOperation.succeed({
        handoff: "custom_flow",
        accounts_selected: accountsToAdd.length,
      });
      customFlow.onImportAccounts({ navigation, routeParams: route.params, accountsToAdd });
      return;
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
    addAccountOperation.succeed({ accounts_added: accountsToAdd.length });
    const { onSuccess } = route.params;

    if (inline) {
      popInlineScreens();
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
    customFlow,
    currency,
    inline,
    navigation,
    existingAccounts,
    route.params,
    scannedAccounts,
    selectedIds,
    dispatch,
    popInlineScreens,
    addAccountOperation,
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

  const CustomNoAssociatedAccounts = getCustomNoAssociatedAccounts(currency);
  useEffect(() => {
    if (operationStartedOnMount.current) return;
    operationStartedOnMount.current = true;
    lastOperationAttempt.current = consumeRetryAttempt({
      currencyId: currency.id,
      context,
      journeyKey: openedFromRouteKey,
    });
    startOperationAttempt();
  }, [startOperationAttempt, currency.id, context, openedFromRouteKey]);

  useEffect(() => {
    startSubscription();
    return () => stopSubscription(false);
  }, [startSubscription, stopSubscription]);

  const latestScannedAccountBridge = useAccountBridgeOrNull(latestScannedAccount ?? null);

  useEffect(() => {
    if (!latestScannedAccount || !latestScannedAccountBridge) return;
    const hasAlreadyBeenScanned = scannedAccounts.some(a => latestScannedAccount.id === a.id);
    const isAlreadyImportedAccount =
      customFlow?.isAlreadyImportedAccount ?? ((a: Account, b: Account) => a.id === b.id);
    const hasAlreadyBeenImported = existingAccounts.some(a =>
      isAlreadyImportedAccount(a, latestScannedAccount),
    );
    const isNewAccount = latestScannedAccountBridge.isAccountEmpty(latestScannedAccount);

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
  }, [
    customFlow,
    existingAccounts,
    latestScannedAccount,
    latestScannedAccountBridge,
    onlyNewAccounts,
    scannedAccounts,
    selectedIds,
  ]);

  useEffect(() => {
    const hasProcessedLatestScannedAccount =
      !latestScannedAccount || scannedAccounts.some(({ id }) => id === latestScannedAccount.id);

    if (!isAddingAccounts && !scanning && hasProcessedLatestScannedAccount) {
      if (alreadyEmptyAccount && noImportableAccounts) {
        addAccountOperation.succeed({ outcome: "already_empty_account" });
        navigation.replace(ScreenName.AddAccountsWarning, {
          emptyAccount: alreadyEmptyAccount,
          emptyAccountName: alreadyEmptyAccountName,
          currency,
          context,
          onCloseNavigation,
        });
      } else if (noImportableAccounts && CustomNoAssociatedAccounts) {
        addAccountOperation.succeed({ outcome: "no_associated_accounts" });
        navigation.replace(ScreenName.NoAssociatedAccounts, {
          CustomNoAssociatedAccounts,
          onCloseNavigation,
        });
      }
    }
  }, [
    isAddingAccounts,
    alreadyEmptyAccount,
    alreadyEmptyAccountName,
    scanning,
    navigation,
    currency,
    CustomNoAssociatedAccounts,
    context,
    onCloseNavigation,
    latestScannedAccount,
    noImportableAccounts,
    scannedAccounts,
    addAccountOperation,
  ]);

  const scanDeviceAccountsBack = customFlow?.onScanDeviceAccountsBack
    ? () => {
        const backMetadata = analyticsMetadata?.ScanDeviceAccounts?.onBack;
        if (backMetadata)
          track(backMetadata.eventName, {
            ...backMetadata.payload,
          });
        addAccountOperation.fail("ABANDONED", { trigger: "back" });
        customFlow.onScanDeviceAccountsBack?.({ navigation });
      }
    : undefined;

  const isRegionRestricted = error?.name === "CurrencyRegionRestrictedError";

  useEffect(() => {
    if (!isRegionRestricted) return;

    if (inline) {
      onCancel();
      onModalHide();
    } else {
      navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()?.popToTop();
    }

    dispatch(openCurrencyRegionRestrictedDrawer(currency.name));
  }, [isRegionRestricted, inline, onCancel, onModalHide, navigation, dispatch, currency.name]);

  return {
    alreadyEmptyAccount,
    isRegionRestricted,
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
    confirmLabel: t(
      customFlow?.scanDeviceAccountsCtaI18nKey ?? "addAccounts.scanDeviceAccounts.confirm",
      { count: selectedIds.length },
    ),
    scanDeviceAccountsBack,
  };
}
