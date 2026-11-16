import { useEffect, useMemo } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { toExchangeError } from "@ledgerhq/live-common/exchange/intents/index";
import { addSellOperation } from "@ledgerhq/live-common/exchange/sell/sellOperations";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/react";
import type { BroadcastConfig } from "@ledgerhq/types-live";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { broadcastLogger } from "~/datadog";
import { useDispatch, useSelector } from "~/context/hooks";
import { mevProtectionSelector } from "~/reducers/settings";
import type { ExchangeDeviceSession, ExchangeSessionPhase } from "../session";
import { isSponsoredExchange } from "../utils/isSponsoredExchange";

/**
 * Sends the signed operation to the network once the session reaches the `broadcast` phase, then
 * tells the session how it went, even if the drawer is gone by then. The drawer keeps showing the
 * signature spinner meanwhile.
 */
export function useExchangeBroadcast(
  phase: ExchangeSessionPhase,
  store: ExchangeDeviceSession,
): void {
  const dispatch = useDispatch();
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
            sponsored: isSponsoredExchange(exchangeParams),
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
      operation => {
        const { exchangeType, exchange } = broadcastPhase.request.exchangeParams;
        if (exchangeType === ExchangeType.SELL || exchangeType === ExchangeType.SELL_NG) {
          const mainAccount = getMainAccount(exchange.fromAccount, exchange.fromParentAccount);
          dispatch(
            updateAccountWithUpdater({
              accountId: mainAccount.id,
              updater: account => addSellOperation(account, operation),
            }),
          );
        }
        store.broadcastSucceeded(broadcastPhase, operation);
      },
      error => store.broadcastFailed(broadcastPhase, toExchangeError(error)),
    );
  }, [broadcast, broadcastPhase, store, dispatch]);
}
