import type { SignedOperation } from "@ledgerhq/types-live";
import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import { signTransactionLogic } from "../logic/signTransaction";
import type { HandlerDeps } from "./types";
import { promisifyUiHandler } from "./promisifyUiHandler";

export function createTransactionSignHandler(
  getDeps: () => HandlerDeps,
): WalletHandlers["transaction.sign"] {
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
          account.type === "TokenAccount" ? account.token.parentCurrencyId : account.currency.id;
        return promisifyUiHandler<SignedOperation>({
          invokeUi: ({ onSuccess, onError }) =>
            uiTxSign({
              account,
              parentAccount,
              signFlowInfos,
              options,
              onSuccess,
              onError,
            }),
          onSuccess: () => tracking.signTransactionSuccess(manifest),
          onFail: () => tracking.signTransactionFail(manifest),
        });
      },
      tokenCurrency,
    );

    return currency === "solana"
      ? Buffer.from(signedOperation.signature, "hex")
      : Buffer.from(signedOperation.signature);
  };
}
