import type { Operation } from "@ledgerhq/types-live";
import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import { getEnv } from "@ledgerhq/live-env";
import { signRawTransactionLogic } from "../../logic/signRawTransaction";
import { broadcastTransactionLogic } from "../../logic/broadcastTransaction";
import { getAccountBridge } from "../../../bridge";
import { getMainAccount } from "../../../account";
import type { HandlerDeps } from "../types";

export function createTransactionSignRawHandler(getDeps: () => HandlerDeps): WalletHandlers["transaction.signRaw"] {
  return async ({ accountId, transaction, broadcast, options }) => {
    const { uiTxSignRaw, uiTxBroadcast, manifest, accounts, tracking, config } = getDeps();
    if (!uiTxSignRaw) {
      throw new Error("transaction.signRaw UI handler not configured");
    }

    const signedOperation = await signRawTransactionLogic(
      { manifest, accounts, tracking },
      accountId,
      transaction,
      (account, parentAccount, tx) =>
        new Promise((resolve, reject) => {
          let done = false;
          return uiTxSignRaw({
            account,
            parentAccount,
            transaction: tx,
            broadcast,
            options,
            onSuccess: signedOperation => {
              if (done) return;
              done = true;
              tracking.signRawTransactionSuccess(manifest);
              resolve(signedOperation);
            },
            onError: error => {
              if (done) return;
              done = true;
              tracking.signRawTransactionFail(manifest);
              reject(error);
            },
          });
        }),
    );

    let hash: string | undefined;
    if (broadcast) {
      hash = await broadcastTransactionLogic(
        { manifest, accounts, tracking },
        accountId,
        signedOperation,
        async (account, parentAccount, signedOperation) => {
          const bridge = getAccountBridge(account, parentAccount);
          const mainAccount = getMainAccount(account, parentAccount);

          const networkId =
            account.type === "TokenAccount"
              ? account.token.parentCurrency.id
              : account.currency.id;

          const broadcastTrackingData = {
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
      );
    }

    return {
      signedTransactionHex: signedOperation.signature,
      transactionHash: hash,
    };
  };
}
