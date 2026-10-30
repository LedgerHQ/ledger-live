import { useEffect, useMemo } from "react";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { normalizeError } from "@ledgerhq/live-common/exchange/intents/index";
import type { BroadcastConfig } from "@ledgerhq/types-live";
import { broadcastLogger } from "~/datadog";
import { useSelector } from "~/context/hooks";
import { mevProtectionSelector } from "~/reducers/settings";
import type { ExchangeDeviceSession, ExchangeSessionPhase } from "../session";

/**
 * Sends the signed operation to the network once the session reaches the `broadcast` phase, then
 * tells the session how it went, even if the drawer is gone by then. The drawer keeps showing the
 * signature spinner meanwhile.
 */
export function useExchangeBroadcast(
  phase: ExchangeSessionPhase,
  store: ExchangeDeviceSession,
): void {
  const mevProtected = useSelector(mevProtectionSelector);
  const broadcastPhase = phase.step === "broadcast" ? phase : null;
  const exchangeParams = broadcastPhase?.request.exchangeParams;
  const fromAccount = exchangeParams?.exchange.fromAccount;
  const fromParentAccount = exchangeParams?.exchange.fromParentAccount;

  const broadcastConfig = useMemo<BroadcastConfig | undefined>(
    () =>
      exchangeParams
        ? {
            mevProtected,
            sponsored: exchangeParams.sponsored,
            source: { type: "swap", name: exchangeParams.provider },
          }
        : undefined,
    [mevProtected, exchangeParams],
  );

  const broadcast = useBroadcast({
    account: fromAccount,
    parentAccount: fromParentAccount,
    broadcastConfig,
    logger: broadcastLogger,
  });

  useEffect(() => {
    if (!broadcastPhase || !store.startBroadcast(broadcastPhase)) return;

    broadcast(broadcastPhase.signedOperation).then(
      operation => store.broadcastSucceeded(broadcastPhase, operation),
      error => store.broadcastFailed(broadcastPhase, normalizeError(error)),
    );
  }, [broadcast, broadcastPhase, store]);
}
