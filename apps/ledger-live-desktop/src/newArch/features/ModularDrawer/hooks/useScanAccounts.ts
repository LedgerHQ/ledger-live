import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { Account } from "@ledgerhq/types-live";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { Subscription } from "rxjs";
import { WARNING_REASON, WarningReason } from "../types";
import { getLLDCoinFamily } from "~/renderer/families";
import useAddAccountAnalytics from "../analytics/useAddAccountAnalytics";
import {
  ADD_ACCOUNT_EVENTS_NAME,
  ADD_ACCOUNT_FLOW_NAME,
  ADD_ACCOUNT_PAGE_NAME,
} from "../analytics/addAccount.types";
import * as RX from "rxjs/operators";
import {
  deselectImportable,
  getToggledIds,
  selectImportable,
} from "../screens/ScanAccounts/utils/selectionHelpers";
import {
  determineSelectedIds,
  getGroupedAccounts,
  processAccounts,
} from "../screens/ScanAccounts/utils/processAccounts";

export type UseScanAccountsProps = {
  currency: CryptoCurrency;
  deviceId: string;
  onComplete: (accounts: Account[]) => void;
  navigateToWarningScreen: (reason: WarningReason, account?: Account) => void;
};

interface State {
  scannedAccounts: Account[];
  scanning: boolean;
}

export function useScanAccounts({
  currency,
  deviceId,
  onComplete,
  navigateToWarningScreen,
}: UseScanAccountsProps) {
  const { trackAddAccountEvent } = useAddAccountAnalytics();
  const existingAccounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const [{ scannedAccounts, scanning }, setState] = useState<State>({
    scannedAccounts: [],
    scanning: true,
  });

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

  const stopSubscription = useCallback((syncUI = true) => {
    if (scanSubscription.current) {
      scanSubscription.current.unsubscribe();
      scanSubscription.current = null;

      if (syncUI) {
        setState(prev => ({
          ...prev,
          scanning: false,
        }));
      }
    }
  }, []);

  useEffect(() => {
    const bridge = getCurrencyBridge(currency);
    const syncConfig = {
      paginationConfig: {
        operations: 0,
      },
      blacklistedTokenIds: blacklistedTokenIds || [],
    };

    const scannedAccounts$ = bridge
      .scanAccounts({ currency, deviceId, syncConfig })
      .pipe(RX.scan((acc: Account[], { account }) => [...acc, account], []));

    scanSubscription.current = scannedAccounts$.subscribe({
      next: scannedAccounts => {
        const { onlyNewAccounts, unimportedAccounts } = processAccounts(
          scannedAccounts,
          existingAccounts,
        );

        setSelectedIds(current =>
          determineSelectedIds(unimportedAccounts, onlyNewAccounts, current),
        );

        setState({
          scanning: true,
          scannedAccounts,
        });
      },
      error: error => {
        setError(error);
      },
      complete: () => {
        setState(prev => ({
          ...prev,
          scanning: false,
        }));
      },
    });

    return () => stopSubscription(false);
  }, [blacklistedTokenIds, currency, deviceId, existingAccounts, stopSubscription]);

  const handleConfirm = useCallback(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Confirm",
      page: ADD_ACCOUNT_PAGE_NAME.LOOKING_FOR_ACCOUNTS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });
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
  }, [dispatch, existingAccounts, scannedAccounts, selectedIds, onComplete, trackAddAccountEvent]);

  const toggleShowAllCreatedAccounts = useCallback(
    () => setShowAllCreatedAccounts(prevState => !prevState),
    [],
  );

  const { importableAccounts, creatableAccounts, alreadyEmptyAccount } = useMemo(
    () =>
      getGroupedAccounts(
        existingAccounts,
        scannedAccounts,
        scanning,
        newAccountSchemes,
        showAllCreatedAccounts,
      ),
    [newAccountSchemes, existingAccounts, scannedAccounts, scanning, showAllCreatedAccounts],
  );

  const allImportableAccountsSelected = useMemo(
    () =>
      importableAccounts.length > 0 &&
      importableAccounts.every(account => selectedIds.includes(account.id)),
    [importableAccounts, selectedIds],
  );

  const handleToggle = useCallback((accountId: string) => {
    setSelectedIds(prev => getToggledIds(prev, accountId));
  }, []);

  const handleSelectAll = useCallback(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Select all",
      page: ADD_ACCOUNT_PAGE_NAME.LOOKING_FOR_ACCOUNTS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });
    setSelectedIds(prev => selectImportable(prev, importableAccounts));
  }, [importableAccounts, trackAddAccountEvent]);

  const handleDeselectAll = useCallback(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Deselect all",
      page: ADD_ACCOUNT_PAGE_NAME.LOOKING_FOR_ACCOUNTS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });
    setSelectedIds(prev => deselectImportable(prev, importableAccounts));
  }, [importableAccounts, trackAddAccountEvent]);

  useEffect(() => {
    const CustomNoAssociatedAccounts =
      currency.type === "CryptoCurrency"
        ? getLLDCoinFamily(currency.family).NoAssociatedAccounts
        : null;

    if (!scanning && !hasImportedAccounts) {
      if (alreadyEmptyAccount && !importableAccounts.length) {
        navigateToWarningScreen(WARNING_REASON.ALREADY_EMPTY_ACCOUNT, alreadyEmptyAccount);
      } else if (
        (!creatableAccounts.length || !importableAccounts.length) &&
        CustomNoAssociatedAccounts
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
