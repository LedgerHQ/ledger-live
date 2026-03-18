import { useCallback, useEffect, useRef, useState } from "react";
import type { ConcordiumPairingProgress } from "@ledgerhq/coin-concordium/types";
import { ConcordiumPairingStatus } from "@ledgerhq/coin-concordium/types";
import { ConcordiumPairingExpiredError } from "@ledgerhq/errors";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { log } from "@ledgerhq/logs";
import { Subscription } from "rxjs";
import { getConcordiumBridge } from "@ledgerhq/live-common/families/concordium/bridgeHelper";

const MAX_EXPIRED_RETRIES = 3;

export enum PairStatus {
  CONNECTING = "CONNECTING",
  QR_READY = "QR_READY",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export function usePairing(currency: CryptoCurrency, onPaired: (sessionTopic: string) => void) {
  const [pairStatus, setPairStatus] = useState<PairStatus>(PairStatus.CONNECTING);
  const [walletConnectUri, setWalletConnectUri] = useState<string | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);
  const retryCountRef = useRef(0);

  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  const startPairing = useCallback(() => {
    unsubscribe();
    retryCountRef.current = 0;
    setPairStatus(PairStatus.CONNECTING);
    setWalletConnectUri(null);

    startPairingInternal();

    function startPairingInternal() {
      const bridge = getConcordiumBridge(currency);
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
                onPaired(data.sessionTopic);
              }
              break;
            case ConcordiumPairingStatus.ERROR:
              unsubscribe();
              setPairStatus(PairStatus.ERROR);
              break;
          }
        },
        error: (error: unknown) => {
          if (
            error instanceof ConcordiumPairingExpiredError &&
            retryCountRef.current < MAX_EXPIRED_RETRIES
          ) {
            retryCountRef.current++;
            log("concordium-onboarding", "pairing expired, retrying", {
              attempt: retryCountRef.current,
            });
            setPairStatus(PairStatus.CONNECTING);
            setWalletConnectUri(null);
            startPairingInternal();
            return;
          }
          unsubscribe();
          setPairStatus(PairStatus.ERROR);
        },
      });
    }
  }, [currency, onPaired, unsubscribe]);

  useEffect(() => {
    startPairing();
    return unsubscribe;
  }, [startPairing, unsubscribe]);

  return { pairStatus, walletConnectUri, startPairing };
}
