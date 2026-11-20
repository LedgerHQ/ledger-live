import { track } from "@shared/analytics";
import { useNavigation, useRoute } from "@react-navigation/core";
import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { concat, from, Subscription } from "rxjs";
import { ignoreElements } from "rxjs/operators";
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
import type { OperationFailureReason } from "@shared/observability-operations";
import { useOperation } from "@shared/observability-operations-react";
import { ADD_ACCOUNT_OPERATION } from "LLM/features/Accounts/constants";
import { consumeRetryAttempt, markRetryPending } from "./addAccountAttempts";
import type { ScanDeviceAccountsNavigationProps, ScanDeviceAccountsViewModelProps } from "./types";

/** Region restriction is an expected business outcome, not a scan failure. */
const getScanFailureReason = (errorName?: string): OperationFailureReason =>
  errorName === "CurrencyRegionRestrictedError" ? "OTHER" : "ERROR";

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
    device: { deviceId },
    inline,
    returnToSwap,
    onCloseNavigation,
    navigationDepth,
    context,
  } = route.params || {};

  const customFlow = getCustomAddAccountFlow(currency);

  const addAccountOperation = useOperation(ADD_ACCOUNT_OPERATION);
  /** The last attempt: a retry after a failure, here or before an inline goBack, starts the next. */
  const operationAttempt = useRef(0);
  const operationStartedOnMount = useRef(false);
  const operationStartAttributes = useMemo(
    () => ({ currency_id: currency.id, inline: !!inline, context }),
    [currency.id, inline, context],
  );
  // Called on mount and on a user restart only: the scan effect also re-runs when its
  // dependencies change, and that must not open a new operation once the previous one ended.
  // A restart while the operation is still active keeps it: start is idempotent.
  const startOperationAttempt = useCallback(() => {
    if (
      addAccountOperation.start({
        ...operationStartAttributes,
        attempt: operationAttempt.current + 1,
      })
    ) {
      operationAttempt.current += 1;
    }
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
  const cryptoCurrency =
    currency.type === "TokenCurrency" ? getCryptoCurrencyById(currency.parentCurrencyId) : currency;
  const currencyBridge = useCurrencyBridge(cryptoCurrency);
  const startSubscription = useCallback(() => {
    const syncConfig = {
      paginationConfig: {
        operations: 0,
      },
      blacklistedTokenIds,
    };
    // will be set to false if an existing account is found
    scanSubscription.current = concat(
      from(prepareCurrency(cryptoCurrency)).pipe(ignoreElements()),
      currencyBridge.scanAccounts({
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
        const errorName = typeof error?.name === "string" ? error.name : undefined;
        addAccountOperation.fail(getScanFailureReason(errorName), { error_name: errorName });
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
      // The scan screen device selection opens next goes on counting from this attempt.
      markRetryPending({ currencyId: currency.id, context, attempt: operationAttempt.current });
      // Simply go back to SelectDevice which is already in the stack
      navigation.goBack();
      return;
    }

    restartSubscription();
  }, [inline, error, navigation, restartSubscription, currency.id, context]);
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
    // Nothing to add: the screen stays mounted under the accounts list, so end the operation here.
    addAccountOperation.fail("OTHER", { outcome: "nothing_to_add" });
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
        // End the operation before `replace` unmounts the screen, which would abandon it.
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
    // Mount only: a later change of the start attributes must not reopen an ended operation.
    if (operationStartedOnMount.current) return;
    operationStartedOnMount.current = true;
    // After an inline Retry, the new operation is the next attempt of the one that failed.
    operationAttempt.current = consumeRetryAttempt({ currencyId: currency.id, context });
    startOperationAttempt();
  }, [startOperationAttempt, currency.id, context]);

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
        addAccountOperation.fail("OTHER", { outcome: "already_empty_account" });
        navigation.replace(ScreenName.AddAccountsWarning, {
          emptyAccount: alreadyEmptyAccount,
          emptyAccountName: alreadyEmptyAccountName,
          currency,
          context,
          onCloseNavigation,
        });
      } else if (noImportableAccounts && CustomNoAssociatedAccounts) {
        addAccountOperation.fail("OTHER", { outcome: "no_associated_accounts" });
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
        // Same outcome as the header back of the default flow (Accounts Navigator).
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
