import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import { receiveOnAccountLogic } from "../../logic/receiveOnAccount";
import type { HandlerDeps } from "../types";

export function createAccountReceiveHandler(
  getDeps: () => HandlerDeps,
): WalletHandlers["account.receive"] {
  return ({ accountId, tokenCurrency }) => {
    const { uiAccountReceive, walletState, manifest, accounts, tracking } = getDeps();
    if (!uiAccountReceive) {
      throw new Error("account.receive UI handler not configured");
    }

    return receiveOnAccountLogic(
      walletState,
      { manifest, accounts, tracking },
      accountId,
      (account, parentAccount, accountAddress) =>
        new Promise((resolve, reject) => {
          let done = false;
          return uiAccountReceive({
            account,
            parentAccount,
            accountAddress,
            onSuccess: accountAddress => {
              if (done) return;
              done = true;
              tracking.receiveSuccess(manifest);
              resolve(accountAddress);
            },
            onCancel: () => {
              if (done) return;
              done = true;
              tracking.receiveFail(manifest);
              reject(new Error("User cancelled"));
            },
            onError: error => {
              if (done) return;
              done = true;
              tracking.receiveFail(manifest);
              reject(error);
            },
          });
        }),
      tokenCurrency,
    );
  };
}
