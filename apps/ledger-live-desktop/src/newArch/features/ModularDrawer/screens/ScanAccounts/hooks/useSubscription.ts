import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { Account } from "@ledgerhq/types-live";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Subscription } from "rxjs";

export type UseSubscriptionProps = {
  currency: CryptoCurrency;
  deviceId: string;
  accountScanned: (account: Account) => void;
};

export function useSubscription({ currency, deviceId, accountScanned }: UseSubscriptionProps) {
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);

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
          accountScanned(account);
        },
        complete: () => setScanning(false),
        error: error => {
          setError(error);
        },
      });
  }, [blacklistedTokenIds, currency, deviceId, accountScanned]);

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
  };
}
