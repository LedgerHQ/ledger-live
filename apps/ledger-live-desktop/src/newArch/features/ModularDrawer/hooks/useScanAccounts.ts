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
import useAddAccountAnalytics from "../analytics/useAddAccountAnalytics";
import {
  ADD_ACCOUNT_EVENTS_NAME,
  ADD_ACCOUNT_FLOW_NAME,
  ADD_ACCOUNT_PAGE_NAME,
} from "../analytics/addAccount.types";
import * as RX from "rxjs/operators";

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

    const scannedAccounts$ = bridge
      .scanAccounts({ currency, deviceId, syncConfig })
      .pipe(RX.scan((acc: Account[], { account }) => [...acc, account], []));

    scanSubscription.current = scannedAccounts$.subscribe({
      next: scannedAccounts => {
        const uniqueScannedAccounts: Account[] = [];
        const uniqueScannedAccountsSet = new Set();
        scannedAccounts.forEach(account => {
          const alreadyExists = existingAccounts.some(a => a.id === account.id);

          if (!alreadyExists && !uniqueScannedAccountsSet.has(account.id)) {
            uniqueScannedAccountsSet.add(account.id);
            uniqueScannedAccounts.push(account);
          }
        });

        setState({
          scanning: true,
          scannedAccounts,
        });

        const onlyNewAccounts = uniqueScannedAccounts.every(acc => isAccountEmpty(acc));

        if (onlyNewAccounts) {
          setSelectedIds(uniqueScannedAccounts.map(x => x.id));
        } else {
          const latestAccount = uniqueScannedAccounts[uniqueScannedAccounts.length - 1];
          if (!isAccountEmpty(latestAccount)) {
            setSelectedIds(ids => [...ids, latestAccount.id]);
          }
        }
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
  }, [blacklistedTokenIds, currency, deviceId, existingAccounts]);

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

  const cantCreateAccount = creatableAccounts.length === 0;
  const hasImportableAccounts = importableAccounts.length > 0;

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
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Select all",
      page: ADD_ACCOUNT_PAGE_NAME.LOOKING_FOR_ACCOUNTS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });
    const importableAccountIds = importableAccounts.map(a => a.id);
    setSelectedIds(prevSelectedIds => {
      return [...new Set([...prevSelectedIds, ...importableAccountIds])];
    });
  }, [importableAccounts, trackAddAccountEvent]);

  const handleDeselectAll = useCallback(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Deselect all",
      page: ADD_ACCOUNT_PAGE_NAME.LOOKING_FOR_ACCOUNTS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });
    const importableAccountIds = importableAccounts.map(a => a.id);
    setSelectedIds(prevSelectedIds => {
      return prevSelectedIds.filter(id => !importableAccountIds.includes(id));
    });
  }, [importableAccounts, trackAddAccountEvent]);

  useEffect(() => {
    startSubscription();
    return () => stopSubscription(false);
  }, [startSubscription, stopSubscription]);

  useEffect(() => {
    if (
      !scanning &&
      alreadyEmptyAccount &&
      !hasImportableAccounts &&
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
    hasImportableAccounts,
    cantCreateAccount,
    alreadyEmptyAccount,
    alreadyEmptyAccountName,
    scanning,
    currency,
    CustomNoAssociatedAccounts,
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
