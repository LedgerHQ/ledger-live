import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { Subscription } from "rxjs";
import { openModal } from "~/renderer/actions/modals";
import { setDrawer } from "~/renderer/drawers/Provider";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import * as RX from "rxjs/operators";
import { getLLDCoinFamily } from "~/renderer/families";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import {
  ADD_ACCOUNT_EVENTS_NAME,
  ADD_ACCOUNT_FLOW_NAME,
  ADD_ACCOUNT_PAGE_NAME,
} from "../../analytics/addAccount.types";
import useAddAccountAnalytics from "../../analytics/useAddAccountAnalytics";
import { WARNING_REASON, WarningReason } from "../../domain";
import {
  determineSelectedIds,
  getGroupedAccounts,
  getUnimportedAccounts,
} from "./utils/processAccounts";
import { useCantonCreatableAccounts } from "./hooks/useCantonCreatableAccounts";

const selectImportable = (importable: Account[]) => (selected: string[]) => {
  const importableIds = importable.map(a => a.id);
  return [...new Set([...selected, ...importableIds])];
};

const deselectImportable = (importable: Account[]) => (selected: string[]) => {
  const importableIds = new Set(importable.map(a => a.id));
  return selected.filter(id => !importableIds.has(id));
};

export interface UseScanAccountsProps {
  currency: CryptoCurrency;
  deviceId: string;
  deferAccountAddition?: boolean;
  onComplete: (accounts: Account[]) => void;
  navigateToWarningScreen: (reason: WarningReason, account?: Account) => void;
}

export function useScanAccounts({
  currency,
  deviceId,
  deferAccountAddition = false,
  onComplete,
  navigateToWarningScreen,
}: UseScanAccountsProps) {
  const { trackAddAccountEvent } = useAddAccountAnalytics();
  const existingAccounts = useSelector(accountsSelector);
  const device = useSelector(getCurrentDevice);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const [scannedAccounts, setScannedAccounts] = useState<Account[]>([]);
  const [scanning, setScanning] = useState(true);

  const [showAllCreatedAccounts, setShowAllCreatedAccounts] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [hasImportedAccounts, setHasImportedAccounts] = useState(false);
  const scanSubscriptionRef = useRef<Subscription | null>(null);

  const newAccountSchemes = useMemo(() => {
    const accountSchemes = scannedAccounts
      .filter(a1 => !existingAccounts.map(a2 => a2.id).includes(a1.id) && !a1.used)
      .map(a => a.derivationMode);

    return [...new Set(accountSchemes)];
  }, [existingAccounts, scannedAccounts]);

  const stopSubscription = useCallback((syncUI = true) => {
    if (scanSubscriptionRef.current) {
      scanSubscriptionRef.current.unsubscribe();
      scanSubscriptionRef.current = null;

      if (syncUI) {
        setScanning(false);
      }
    }
  }, []);

  useEffect(() => {
    scanSubscriptionRef.current = getCurrencyBridge(currency)
      .scanAccounts({
        currency,
        deviceId,
        syncConfig: {
          paginationConfig: {
            operations: 0,
          },
          blacklistedTokenIds: blacklistedTokenIds || [],
        },
      })
      .pipe(RX.scan((acc: Account[], { account }) => [...acc, account], []))
      .subscribe({
        next: accounts => {
          setScannedAccounts(accounts);
          setScanning(true);
        },
        error: setError,
        complete: () => setScanning(false),
      });

    return () => stopSubscription(false);
  }, [blacklistedTokenIds, currency, deviceId, stopSubscription]);

  useEffect(() => {
    const unimportedAccounts = getUnimportedAccounts(scannedAccounts, existingAccounts);
    const onlyNewAccounts = unimportedAccounts.every(isAccountEmpty);

    const processedAccountIds = new Set<string>();
    const freshAccounts = unimportedAccounts.filter(acc => {
      if (processedAccountIds.has(acc.id)) {
        return false;
      }
      processedAccountIds.add(acc.id);
      return true;
    });

    setSelectedIds(current => determineSelectedIds(freshAccounts, onlyNewAccounts, current));
  }, [existingAccounts, scannedAccounts]);

  const {
    importableAccounts,
    filteredSelectedIds,
    creatableAccounts,
    alreadyEmptyAccount,
    accountsToImport,
  } = useMemo(() => {
    const { importableAccounts, creatableAccounts, alreadyEmptyAccount } = getGroupedAccounts(
      existingAccounts,
      scannedAccounts,
      scanning,
      newAccountSchemes,
      showAllCreatedAccounts,
    );
    const availableAccounts = [...importableAccounts, ...creatableAccounts];
    const availableAccountIds = new Set(availableAccounts.map(a => a.id));
    const filteredSelectedIds = selectedIds.filter(id => availableAccountIds.has(id));
    const accountsToImport = availableAccounts.filter(a => filteredSelectedIds.includes(a.id));
    return {
      importableAccounts,
      filteredSelectedIds,
      creatableAccounts,
      alreadyEmptyAccount,
      accountsToImport,
    };
  }, [
    existingAccounts,
    scannedAccounts,
    scanning,
    newAccountSchemes,
    showAllCreatedAccounts,
    selectedIds,
  ]);

  const { hasCantonCreatableAccounts, selectedCantonCreatableAccounts } =
    useCantonCreatableAccounts({
      scannedAccounts,
      selectedIds: filteredSelectedIds,
    });

  const handleConfirm = useCallback(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Confirm",
      page: ADD_ACCOUNT_PAGE_NAME.LOOKING_FOR_ACCOUNTS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });

    if (hasCantonCreatableAccounts) {
      setDrawer();

      dispatch(
        openModal("MODAL_CANTON_ONBOARD_ACCOUNT", {
          currency,
          device,
          selectedAccounts: selectedCantonCreatableAccounts,
          existingAccounts: existingAccounts,
          editedNames: {},
        }),
      );

      return;
    }

    if (accountsToImport.length > 0) {
      setHasImportedAccounts(true);
    }

    if (!deferAccountAddition) {
      dispatch(
        addAccountsAction({
          existingAccounts,
          scannedAccounts,
          selectedIds: filteredSelectedIds,
          renamings: {},
        }),
      );
    }

    onComplete(accountsToImport);
  }, [
    trackAddAccountEvent,
    accountsToImport,
    dispatch,
    existingAccounts,
    onComplete,
    currency,
    device,
    hasCantonCreatableAccounts,
    selectedCantonCreatableAccounts,
    filteredSelectedIds,
    scannedAccounts,
    deferAccountAddition,
  ]);

  const toggleShowAllCreatedAccounts = useCallback(() => setShowAllCreatedAccounts(p => !p), []);

  const handleToggle = useCallback((accountId: string) => {
    setSelectedIds(prev =>
      prev.includes(accountId) ? prev.filter(id => id !== accountId) : [...prev, accountId],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Select all",
      page: ADD_ACCOUNT_PAGE_NAME.LOOKING_FOR_ACCOUNTS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });
    setSelectedIds(selectImportable(importableAccounts));
  }, [importableAccounts, trackAddAccountEvent]);

  const handleDeselectAll = useCallback(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Deselect all",
      page: ADD_ACCOUNT_PAGE_NAME.LOOKING_FOR_ACCOUNTS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });
    setSelectedIds(deselectImportable(importableAccounts));
  }, [importableAccounts, trackAddAccountEvent]);

  useEffect(() => {
    const CustomNoAssociatedAccounts =
      currency.type === "CryptoCurrency"
        ? getLLDCoinFamily(currency.family).NoAssociatedAccounts
        : null;

    // TODO: by moving this logic to handleConfirm, we can remove the trigger state and calculate it via memoization to avoid this useEffect
    if (!scanning && !hasImportedAccounts) {
      if (alreadyEmptyAccount && !importableAccounts.length) {
        navigateToWarningScreen(WARNING_REASON.ALREADY_EMPTY_ACCOUNT, alreadyEmptyAccount);
      } else if (
        !importableAccounts.length &&
        !creatableAccounts.length &&
        CustomNoAssociatedAccounts
      ) {
        navigateToWarningScreen(WARNING_REASON.NO_ASSOCIATED_ACCOUNTS);
      }
    }
  }, [
    alreadyEmptyAccount,
    creatableAccounts.length,
    currency,
    hasImportedAccounts,
    importableAccounts.length,
    navigateToWarningScreen,
    scannedAccounts.length,
    scanning,
  ]);

  return {
    creatableAccounts,
    error,
    handleConfirm,
    handleDeselectAll,
    handleSelectAll,
    handleToggle,
    importableAccounts,
    newAccountSchemes,
    scanning,
    selectedIds: filteredSelectedIds,
    showAllCreatedAccounts,
    stopSubscription,
    toggleShowAllCreatedAccounts,
  };
}
