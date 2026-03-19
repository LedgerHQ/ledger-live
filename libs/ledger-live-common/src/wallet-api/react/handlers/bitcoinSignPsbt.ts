import type { Operation } from "@ledgerhq/types-live";
import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import { getEnv } from "@ledgerhq/live-env";
import { signRawTransactionLogic } from "../../logic/signRawTransaction";
import { broadcastTransactionLogic } from "../../logic/broadcastTransaction";
import { getAccountBridge } from "../../../bridge";
import { getMainAccount } from "../../../account";
import type { HandlerDeps } from "../types";

export function createBitcoinSignPsbtHandler(
  getDeps: () => HandlerDeps,
): WalletHandlers["bitcoin.signPsbt"] {
  return async ({ accountId, psbt, broadcast }) => {
    const { uiTxSignRaw, uiTxBroadcast, manifest, accounts, tracking } = getDeps();
    if (!uiTxSignRaw) {
      throw new Error("bitcoin.signPsbt UI handler not configured");
    }

    const signedOperation = await signRawTransactionLogic(
      { manifest, accounts, tracking },
      accountId,
      psbt,
      (account, parentAccount, tx) =>
        new Promise((resolve, reject) => {
          let done = false;
          return uiTxSignRaw({
            account,
            parentAccount,
            transaction: tx,
            broadcast,
            options: undefined,
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

    const rawData = signedOperation.rawData;
    if (!rawData || typeof rawData.psbtSigned !== "string") {
      throw new Error("Missing psbtSigned in signed operation rawData");
    }
    const psbtSigned = rawData.psbtSigned;

    if (broadcast) {
      const txHash = await broadcastTransactionLogic(
        { manifest, accounts, tracking },
        accountId,
        signedOperation,
        async (account, parentAccount, signedOperation) => {
          const bridge = getAccountBridge(account, parentAccount);
          const mainAccount = getMainAccount(account, parentAccount);

          let optimisticOperation: Operation = signedOperation.operation;

          const networkId =
            account.type === "TokenAccount" ? account.token.parentCurrency.id : account.currency.id;

          const broadcastTrackingData = {
            sourceCurrency:
              account.type === "TokenAccount" ? account.token.name : account.currency.name,
            network: networkId,
          };

          if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
            try {
              optimisticOperation = await bridge.broadcast({
                account: mainAccount,
                signedOperation,
              });
              tracking.broadcastSuccess(manifest, broadcastTrackingData);
            } catch (error) {
              tracking.broadcastFail(manifest, broadcastTrackingData);
              throw error;
            }
          }

          if (uiTxBroadcast) {
            uiTxBroadcast(account, parentAccount, mainAccount, optimisticOperation);
          }

          return optimisticOperation.hash;
        },
      );

      return { psbtSigned, txHash };
    }

    return { psbtSigned };
  };
}
