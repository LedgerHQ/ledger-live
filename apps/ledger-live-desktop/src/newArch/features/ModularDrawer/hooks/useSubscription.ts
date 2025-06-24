import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { Account } from "@ledgerhq/types-live";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Subscription } from "rxjs";

export type UseScanAccountsProps = {
  currency: CryptoCurrency;
  deviceId: string;
};

export function useSubscription({ currency, deviceId }: UseScanAccountsProps) {
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);

  const [latestScannedAccount, setLatestScannedAccount] = useState<Account | null>(null);
  const scanSubscription = useRef<Subscription | null>(null);

  const startSubscription = useCallback(() => {
    const bridge = getCurrencyBridge(currency);
    const syncConfig = {
      paginationConfig: {
        operations: 0,
      },
      blacklistedTokenIds: blacklistedTokenIds || [],
    };

    scanSubscription.current = bridge
      .scanAccounts({
        currency: currency,
        deviceId,
        syncConfig,
      })
      .subscribe({
        next: ({ account }) => {
          setLatestScannedAccount(account);
        },
        complete: () => setScanning(false),
        error: error => {
          setError(error);
        },
      });
  }, [blacklistedTokenIds, currency, deviceId]);

  const stopSubscription = useCallback((syncUI = true) => {
    if (scanSubscription.current) {
      scanSubscription.current.unsubscribe();
      scanSubscription.current = null;

      if (syncUI) {
        setScanning(false);
      }
    }
  }, []);

  useEffect(() => {
    startSubscription();
    return () => stopSubscription(false);
  }, [startSubscription, stopSubscription]);

  return {
    error,
    stopSubscription,
    scanning,
    latestScannedAccount,
  };
}
