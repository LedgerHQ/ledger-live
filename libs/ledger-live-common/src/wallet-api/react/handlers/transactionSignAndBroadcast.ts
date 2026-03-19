import type { Operation } from "@ledgerhq/types-live";
import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import { getEnv } from "@ledgerhq/live-env";
import { signTransactionLogic } from "../../logic/signTransaction";
import { broadcastTransactionLogic } from "../../logic/broadcastTransaction";
import { getAccountBridge } from "../../../bridge";
import { getMainAccount } from "../../../account";
import type { HandlerDeps } from "../types";

export function createTransactionSignAndBroadcastHandler(getDeps: () => HandlerDeps): WalletHandlers["transaction.signAndBroadcast"] {
  return async ({ accountId, tokenCurrency, transaction, options, meta }) => {
    const { uiTxSign, uiTxBroadcast, manifest, accounts, tracking, config } = getDeps();
    if (!uiTxSign) {
      throw new Error("transaction.signAndBroadcast UI handler not configured");
    }

    const sponsored = transaction.family === "ethereum" && transaction.sponsored;
    const isEmbeddedSwap = (meta as { isEmbedded?: boolean } | undefined)?.isEmbedded;
    const partner = (meta as { partner?: string } | undefined)?.partner;

    const signedTransaction = await signTransactionLogic(
      { manifest, accounts, tracking },
      accountId,
      transaction,
      (account, parentAccount, signFlowInfos) =>
        new Promise((resolve, reject) => {
          let done = false;
          return uiTxSign({
            account,
            parentAccount,
            signFlowInfos,
            options,
            onSuccess: signedOperation => {
              if (done) return;
              done = true;
              tracking.signTransactionSuccess(manifest, isEmbeddedSwap, partner);
              resolve(signedOperation);
            },
            onError: error => {
              if (done) return;
              done = true;
              tracking.signTransactionFail(manifest, isEmbeddedSwap, partner);
              reject(error);
            },
          });
        }),
      tokenCurrency,
      isEmbeddedSwap,
      partner,
    );

    return broadcastTransactionLogic(
      { manifest, accounts, tracking },
      accountId,
      signedTransaction,
      async (account, parentAccount, signedOperation) => {
        const bridge = getAccountBridge(account, parentAccount);
        const mainAccount = getMainAccount(account, parentAccount);

        const networkId =
          account.type === "TokenAccount"
            ? account.token.parentCurrency.id
            : account.currency.id;

        const broadcastTrackingData = {
          isEmbeddedSwap,
          partner,
          sourceCurrency:
            account.type === "TokenAccount" ? account.token.name : account.currency.name,
          network: networkId,
        };

        let optimisticOperation: Operation = signedOperation.operation;

        if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
          try {
            optimisticOperation = await bridge.broadcast({
              account: mainAccount,
              signedOperation,
              broadcastConfig: {
                mevProtected: !!config.mevProtected,
                sponsored,
                source: { type: "live-app", name: manifest.id },
              },
            });
            tracking.broadcastSuccess(manifest, broadcastTrackingData);
          } catch (error) {
            tracking.broadcastFail(manifest, broadcastTrackingData);
            throw error;
          }
        }

        uiTxBroadcast &&
          uiTxBroadcast(account, parentAccount, mainAccount, optimisticOperation);

        return optimisticOperation.hash;
      },
      tokenCurrency,
    );
  };
}
