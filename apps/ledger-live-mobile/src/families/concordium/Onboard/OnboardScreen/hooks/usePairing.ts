import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import type { ConcordiumCurrencyBridge } from "@ledgerhq/coin-concordium";
import type { ConcordiumPairingProgress } from "@ledgerhq/coin-concordium/types";
import { ConcordiumPairingStatus } from "@ledgerhq/coin-concordium/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Subscription } from "rxjs";

export enum PairStatus {
  CONNECTING = "CONNECTING",
  QR_READY = "QR_READY",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export function usePairing(currency: CryptoCurrency, onPaired: () => void) {
  const [pairStatus, setPairStatus] = useState<PairStatus>(PairStatus.CONNECTING);
  const [walletConnectUri, setWalletConnectUri] = useState<string | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);

  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  const startPairing = useCallback(() => {
    unsubscribe();
    setPairStatus(PairStatus.CONNECTING);
    setWalletConnectUri(null);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const bridge = getCurrencyBridge(currency) as ConcordiumCurrencyBridge;
    subscriptionRef.current = bridge.pairWalletConnect(currency.id, "").subscribe({
      next: (data: ConcordiumPairingProgress) => {
        switch (data.status) {
          case ConcordiumPairingStatus.PREPARE:
            if (data.walletConnectUri) {
              setWalletConnectUri(data.walletConnectUri);
              setPairStatus(PairStatus.QR_READY);
            }
            break;
          case ConcordiumPairingStatus.SUCCESS:
            if (data.sessionTopic) {
              unsubscribe();
              setPairStatus(PairStatus.SUCCESS);
              onPaired();
            }
            break;
          case ConcordiumPairingStatus.ERROR:
            setPairStatus(PairStatus.ERROR);
            break;
        }
      },
      error: () => {
        setPairStatus(PairStatus.ERROR);
      },
    });
  }, [currency, onPaired, unsubscribe]);

  useEffect(() => {
    startPairing();
    return unsubscribe;
  }, [startPairing, unsubscribe]);

  return { pairStatus, walletConnectUri, startPairing };
}
