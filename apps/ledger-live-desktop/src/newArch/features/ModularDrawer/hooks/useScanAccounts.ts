import { Account } from "@ledgerhq/types-live";
import { useCallback, useEffect, useMemo, useState } from "react";
import { counterValueFormatter } from "LLD/utils/counterValueFormatter";
import {
    blacklistedTokenIdsSelector,
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { useSelector } from "react-redux";
import { BehaviorSubject } from "rxjs";
import * as RX from "rxjs/operators";
import { formatAddress } from "~/newArch/utils/formatAddress";
import { useMaybeAccountName, walletSelector } from "~/renderer/reducers/wallet";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { Account as AccountItemAccount } from "@ledgerhq/react-ui/pre-ldls/components/AccountItem/AccountItem";

import { groupAddAccounts } from "@ledgerhq/live-wallet/addAccounts";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { accountsSelector } from "~/renderer/reducers/accounts";

export type UseScanAccountsProps = {
  currency: CryptoCurrency;
  deviceId: string;
  onComplete: (accounts: Account[]) => void;
};

export function useScanAccounts({ currency, deviceId, onComplete }: UseScanAccountsProps) {
  const walletState = useSelector(walletSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const existingAccounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);

  const [scannedAccounts, setScannedAccounts] = useState<Account[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const [isScanning, setIsScanning] = useState(true);
  const [isScanning$] = useState(() => new BehaviorSubject(isScanning));
  useEffect(() => {
    const subscription = isScanning$.subscribe(x => {
      setIsScanning(x);
    });
    return () => subscription.unsubscribe();
  }, [isScanning$]);

  useEffect(() => {
    const bridge = getCurrencyBridge(currency);

    const seenIds = new Set<string>();

    const subcription = bridge
      .scanAccounts({
        currency,
        deviceId,
        syncConfig: {
          paginationConfig: {},
          blacklistedTokenIds: blacklistedTokenIds || [],
        },
      })
      .pipe(
        RX.takeUntil(isScanning$.pipe(RX.filter(x => !x))),
        RX.tap(x => console.log("SCAN ACCOUNT EVENT", { x })),
        RX.filter(x => x.type === "discovered"),
        RX.map(x => x.account),
      )
      .subscribe({
        next: x => {
          if (seenIds.has(x.id)) {
            return;
          }
          seenIds.add(x.id);
          setScannedAccounts(prev => [...prev, x]);
        },
        complete: () => isScanning$.next(false),
        error: () => isScanning$.next(false), // TODO could surface the error UI-wise
      });
    return () => {
      setScannedAccounts([]);
      subcription.unsubscribe();
    };
  }, [blacklistedTokenIds, currency, deviceId, isScanning$]);

  const currencyName = currency.name;

  const formattedAccounts = useMemo(
    () =>
      scannedAccounts.map(
        (account): AccountItemAccount => ({
          // TODO review freshAddress
          address: formatAddress(account.freshAddress),
          cryptoId: account.currency.id,
          fiatValue: counterValueFormatter({
            currency: counterValueCurrency.ticker,
            value: account.balance.toNumber(),
            locale,
            allowZeroValue: true,
            discreetMode: discreet,
          }),
          id: account.id,
          name: accountNameWithDefaultSelector(walletState, account),
          ticker: account.currency.ticker,
        }),
      ),
    [counterValueCurrency.ticker, discreet, locale, scannedAccounts, walletState],
  );

  const handleToggle = useCallback((id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    () => setCheckedIds(new Set(formattedAccounts.map(a => a.id))),
    [formattedAccounts],
  );

  const handleDeselectAll = useCallback(() => setCheckedIds(new Set()), []);

  const handleConfirm = useCallback(
    () => onComplete(scannedAccounts.filter(a => checkedIds.has(a.id))),
    [scannedAccounts, checkedIds, onComplete],
  );

//   const newAccountSchemes = useMemo(() => {
//     // Find accounts that are (scanned && !existing && !used)
//     const accountSchemes = scannedAccounts
//       ?.filter(a1 => !existingAccounts.map(a2 => a2.id).includes(a1.id) && !a1.used)
//       .map(a => a.derivationMode);

//     // Make sure to return a list of unique derivationModes (i.e: avoid duplicates)
//     return [...new Set(accountSchemes)];
//   }, [existingAccounts, scannedAccounts]);

//   const preferredNewAccountScheme = useMemo(
//     () => (newAccountSchemes && newAccountSchemes.length > 0 ? newAccountSchemes[0] : undefined),
//     [newAccountSchemes],
//   );

//   const { sections, alreadyEmptyAccount } = useMemo(
//     () =>
//       groupAddAccounts(existingAccounts, scannedAccounts, {
//         scanning: isScanning,
//         // eslint-disable-next-line no-constant-condition
//         preferredNewAccountSchemes: false // TODO
//           ? undefined
//           : [preferredNewAccountScheme!],
//       }),
//     [existingAccounts, scannedAccounts, isScanning, preferredNewAccountScheme],
//   );
//   const alreadyEmptyAccountName = useMaybeAccountName(alreadyEmptyAccount);
//   const cantCreateAccount = !sections.some(s => s.id === "creatable");
//   const noImportableAccounts = !sections.some(
//     s => s.id === "importable" || s.id === "creatable" || s.id === "migrate",
//   );
//   // We don't show already imported accounts in the UI
//   const sanitizedSections = sections.filter(s => s.id !== "imported");
//   const hasImportableAccounts = sections.find(s => s.id === "importable" && s.data.length > 0);

  return {
    formattedAccounts,
    checkedIds,
    handleToggle,
    handleSelectAll,
    handleDeselectAll,
    handleConfirm,
    isScanning,
    isScanning$,
    currencyName,
    scannedAccounts,
    // cantCreateAccount,
    // noImportableAccounts,
    // alreadyEmptyAccountName,
    // sections: sanitizedSections,
    // hasImportableAccounts,
  };
}
