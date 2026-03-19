import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import { signTransactionLogic } from "../../logic/signTransaction";
import type { HandlerDeps } from "../types";

export function createTransactionSignHandler(getDeps: () => HandlerDeps): WalletHandlers["transaction.sign"] {
  return async ({ accountId, tokenCurrency, transaction, options }) => {
    const { uiTxSign, manifest, accounts, tracking } = getDeps();
    if (!uiTxSign) {
      throw new Error("transaction.sign UI handler not configured");
    }

    let currency: string | undefined;
    const signedOperation = await signTransactionLogic(
      { manifest, accounts, tracking },
      accountId,
      transaction,
      (account, parentAccount, signFlowInfos) => {
        currency =
          account.type === "TokenAccount"
            ? account.token.parentCurrency.id
            : account.currency.id;
        return new Promise((resolve, reject) => {
          let done = false;
          return uiTxSign({
            account,
            parentAccount,
            signFlowInfos,
            options,
            onSuccess: signedOperation => {
              if (done) return;
              done = true;
              tracking.signTransactionSuccess(manifest);
              resolve(signedOperation);
            },
            onError: error => {
              if (done) return;
              done = true;
              tracking.signTransactionFail(manifest);
              reject(error);
            },
          });
        });
      },
      tokenCurrency,
    );

    return currency === "solana"
      ? Buffer.from(signedOperation.signature, "hex")
      : Buffer.from(signedOperation.signature);
  };
}
