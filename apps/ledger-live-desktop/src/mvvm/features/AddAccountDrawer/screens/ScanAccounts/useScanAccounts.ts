import { getAccountBridge, getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { addAccountsAction } from "@ledgerhq/live-common/account/addAccounts";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import { Account } from "@ledgerhq/types-live";
import { toErrorAttributes } from "@shared/observability-operations";
import { useOperation } from "@shared/observability-operations-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { concat, from, Subscription } from "rxjs";
import { prepareCurrency } from "~/renderer/bridge/cache";
import { openModal } from "~/renderer/actions/modals";
import { setDrawer } from "~/renderer/drawers/Provider";
import * as RX from "rxjs/operators";
import { useLLDCoinFamily } from "~/renderer/families";
import { openCurrencyRegionRestrictedDialog } from "LLD/features/CurrencyRegionRestrictedDialog/currencyRegionRestrictedDialog";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import { modularDialogSourceSelector } from "~/renderer/reducers/modularDialog";
import {
  ADD_ACCOUNT_EVENTS_NAME,
  ADD_ACCOUNT_FLOW_NAME,
  ADD_ACCOUNT_PAGE_NAME,
} from "../../analytics/addAccount.types";
import useAddAccountAnalytics from "../../analytics/useAddAccountAnalytics";
import { ADD_ACCOUNT_OPERATION, WARNING_REASON, WarningReason } from "../../domain";
import { computeSelectedIdsFromScan, getGroupedAccounts } from "./utils/processAccounts";
import { normalizeScanError } from "./utils/normalizeScanError";
import { useConcordiumCreatableAccounts } from "./hooks/concordium/useConcordiumCreatableAccounts";

const selectImportable = (importable: Account[]) => (selected: string[]) => {
  const importableIds = importable.map(a => a.id);
  return [...new Set([...selected, ...importableIds])];
};

const deselectImportable = (importable: Account[]) => (selected: string[]) => {
  const importableIds = new Set(importable.map(a => a.id));
  return selected.filter(id => !importableIds.has(id));
};

const toTransport = (wired: unknown) => {
  if (typeof wired !== "boolean") return undefined;
  return wired ? "usb" : "ble";
};

export interface UseScanAccountsProps {
  currency: CryptoCurrency;
  device: Device;
  attempt?: number;
  isToken?: boolean;
  inline?: boolean;
  deferAccountAddition?: boolean;
  onComplete: (accounts: Account[]) => void;
  navigateToWarningScreen: (reason: WarningReason, account?: Account) => void;
}

export function useScanAccounts({
  currency,
  device,
  attempt = 1,
  isToken = false,
  inline = false,
  deferAccountAddition = false,
  onComplete,
  navigateToWarningScreen,
}: UseScanAccountsProps) {
  const { deviceId, modelId, wired } = device;
  const { trackAddAccountEvent } = useAddAccountAnalytics();
  const existingAccounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const source = useSelector(modularDialogSourceSelector);
  const addAccountOperation = useOperation(ADD_ACCOUNT_OPERATION);
  const operationStartedOnMount = useRef(false);
  const familyImpl = useLLDCoinFamily(currency.family);
  const [error, setError] = useState<Error | null>(null);
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

  const stopSubscription = useCallback(
    (syncUI = true) => {
      if (scanSubscriptionRef.current) {
        scanSubscriptionRef.current.unsubscribe();
        scanSubscriptionRef.current = null;

        if (syncUI) {
          setScanning(false);
          addAccountOperation.annotate({ step: "selecting", scan_stopped_by_user: true });
        }
      }
    },
    [addAccountOperation],
  );

  useEffect(() => {
    if (operationStartedOnMount.current) return;
    operationStartedOnMount.current = true;
    addAccountOperation.start({
      currency_id: currency.id,
      currency_family: currency.family,
      is_token: isToken,
      device_model_id: modelId,
      transport: toTransport(wired),
      inline,
      source: source || undefined,
      attempt,
    });
  }, [
    addAccountOperation,
    currency.id,
    currency.family,
    isToken,
    modelId,
    wired,
    inline,
    source,
    attempt,
  ]);

  useEffect(() => {
    let cancelled = false;
    emptyByIdRef.current = new Map();
    const discoveredAccountIds = new Set<string>();
    addAccountOperation.annotate({ step: "preparing", accounts_scanned: 0 });
    (async () => {
      const bridge = await getCurrencyBridge(currency);
      if (cancelled) return;
      scanSubscriptionRef.current = concat(
        from(prepareCurrency(currency)).pipe(
          RX.ignoreElements(),
          RX.tap({ complete: () => addAccountOperation.annotate({ step: "scanning" }) }),
        ),
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
          RX.tap(({ account }) => {
            discoveredAccountIds.add(account.id);
            addAccountOperation.annotate({ accounts_scanned: discoveredAccountIds.size });
          }),
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
          error: e => {
            const scanError = normalizeScanError(e);
            setError(scanError);
            if (scanError.name === "CurrencyRegionRestrictedError") {
              addAccountOperation.succeed({ outcome: "region_restricted" });
            } else {
              addAccountOperation.fail("ERROR", toErrorAttributes(e));
            }
          },
          complete: () => {
            setScanning(false);
            addAccountOperation.annotate({ step: "selecting" });
          },
        });
    })();

    return () => {
      cancelled = true;
      stopSubscription(false);
    };
  }, [
    blacklistedTokenIds,
    currency,
    deviceId,
    isAccountEmpty,
    stopSubscription,
    addAccountOperation,
  ]);

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
      addAccountOperation.succeed({
        handoff: "concordium_onboarding",
        accounts_selected: selectedConcordiumAccounts.length,
      });
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

    if (deferAccountAddition) {
      addAccountOperation.succeed({
        handoff: "custom_flow",
        accounts_selected: accountsToImport.length,
      });
    } else {
      dispatch(
        addAccountsAction({
          existingAccounts,
          scannedAccounts,
          selectedIds: filteredSelectedIds,
          renamings: {},
        }),
      );
      addAccountOperation.succeed({ accounts_added: accountsToImport.length });
    }

    onComplete(accountsToImport);
  }, [
    addAccountOperation,
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
      const nothingToAdd = !importableAccounts.length && !creatableAccounts.length;
      if (alreadyEmptyAccount && nothingToAdd) {
        addAccountOperation.succeed({ outcome: "already_empty_account" });
        navigateToWarningScreen(WARNING_REASON.ALREADY_EMPTY_ACCOUNT, alreadyEmptyAccount);
      } else if (nothingToAdd && CustomNoAssociatedAccounts) {
        addAccountOperation.succeed({ outcome: "no_associated_accounts" });
        navigateToWarningScreen(WARNING_REASON.NO_ASSOCIATED_ACCOUNTS);
      } else if (nothingToAdd) {
        addAccountOperation.succeed({ outcome: "nothing_to_add" });
      }
    }
  }, [
    addAccountOperation,
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

  const isRegionRestricted = error?.name === "CurrencyRegionRestrictedError";

  useEffect(() => {
    if (!isRegionRestricted) return;
    setDrawer();
    dispatch(openCurrencyRegionRestrictedDialog(currency.name));
  }, [isRegionRestricted, dispatch, currency.name]);

  return {
    creatableAccounts,
    error,
    isRegionRestricted,
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
