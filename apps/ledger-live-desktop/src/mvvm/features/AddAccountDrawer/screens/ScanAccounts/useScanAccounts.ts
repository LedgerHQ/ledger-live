import { getAccountBridge, getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { concat, from, Subscription } from "rxjs";
import { prepareCurrency } from "~/renderer/bridge/cache";
import { openModal } from "~/renderer/actions/modals";
import { setDrawer } from "~/renderer/drawers/Provider";
import * as RX from "rxjs/operators";
import { useLLDCoinFamily } from "~/renderer/families";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import {
  ADD_ACCOUNT_EVENTS_NAME,
  ADD_ACCOUNT_FLOW_NAME,
  ADD_ACCOUNT_PAGE_NAME,
} from "../../analytics/addAccount.types";
import useAddAccountAnalytics from "../../analytics/useAddAccountAnalytics";
import { WARNING_REASON, WarningReason } from "../../domain";
import { computeSelectedIdsFromScan, getGroupedAccounts } from "./utils/processAccounts";
import { useConcordiumCreatableAccounts } from "./hooks/concordium/useConcordiumCreatableAccounts";

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
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const familyImpl = useLLDCoinFamily(currency.family);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const [scannedAccounts, setScannedAccounts] = useState<Account[]>([]);
  const [scanning, setScanning] = useState(true);

  const [showAllCreatedAccounts, setShowAllCreatedAccounts] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [hasImportedAccounts, setHasImportedAccounts] = useState(false);
  const scanSubscriptionRef = useRef<Subscription | null>(null);
  const existingAccountsRef = useRef(existingAccounts);
  existingAccountsRef.current = existingAccounts;
  const scannedAccountsRef = useRef(scannedAccounts);
  scannedAccountsRef.current = scannedAccounts;
  // Emptiness is resolved per discovered account in the scan pipeline (getAccountBridge
  // is not safe to call synchronously); the predicate passed to computeSelectedIdsFromScan
  // reads from this ref.
  const emptyByIdRef = useRef<Map<string, boolean>>(new Map());
  const isAccountEmpty = useCallback(
    (account: Account) => emptyByIdRef.current.get(account.id) ?? false,
    [],
  );

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
    let cancelled = false;
    emptyByIdRef.current = new Map();
    (async () => {
      const bridge = await getCurrencyBridge(currency);
      if (cancelled) return;
      scanSubscriptionRef.current = concat(
        from(prepareCurrency(currency)).pipe(RX.ignoreElements()),
        bridge.scanAccounts({
          currency,
          deviceId,
          syncConfig: {
            paginationConfig: {
              operations: 0,
            },
            blacklistedTokenIds: blacklistedTokenIds || [],
          },
        }),
      )
        .pipe(
          RX.concatMap(async ({ account }) => {
            const accountBridge = await getAccountBridge(account);
            emptyByIdRef.current.set(account.id, accountBridge.isAccountEmpty(account));
            return account;
          }),
          RX.scan((acc: Account[], account: Account) => [...acc, account], []),
        )
        .subscribe({
          next: (accounts: Account[]) => {
            setScannedAccounts(accounts);
            setSelectedIds(current =>
              computeSelectedIdsFromScan(
                accounts,
                existingAccountsRef.current,
                current,
                isAccountEmpty,
              ),
            );
            setScanning(true);
          },
          error: setError,
          complete: () => setScanning(false),
        });
    })();

    return () => {
      cancelled = true;
      stopSubscription(false);
    };
  }, [blacklistedTokenIds, currency, deviceId, isAccountEmpty, stopSubscription]);

  useLayoutEffect(() => {
    const resolved = scannedAccountsRef.current.filter(a => emptyByIdRef.current.has(a.id));
    setSelectedIds(current =>
      computeSelectedIdsFromScan(resolved, existingAccounts, current, isAccountEmpty),
    );
  }, [existingAccounts, isAccountEmpty]);

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

  const { hasConcordiumCreatableAccounts, selectedConcordiumAccounts } =
    useConcordiumCreatableAccounts({
      scannedAccounts,
      selectedIds: filteredSelectedIds,
    });

  const handleConfirm = useCallback(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Confirm",
      page: ADD_ACCOUNT_PAGE_NAME.LOOKING_FOR_ACCOUNTS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });

    if (hasConcordiumCreatableAccounts) {
      setDrawer();

      dispatch(
        openModal("MODAL_CONCORDIUM_ONBOARD_ACCOUNT", {
          currency,
          selectedAccounts: selectedConcordiumAccounts,
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
    hasConcordiumCreatableAccounts,
    selectedConcordiumAccounts,
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
    const CustomNoAssociatedAccounts = familyImpl.NoAssociatedAccounts ?? null;

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
    familyImpl,
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
