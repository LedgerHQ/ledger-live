import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import { receiveOnAccountLogic } from "../logic/receiveOnAccount";
import type { HandlerDeps } from "./types";
import { promisifyUiHandler } from "./promisifyUiHandler";

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
        promisifyUiHandler<string>({
          invokeUi: ({ onSuccess, onError, onCancel }) =>
            uiAccountReceive({
              account,
              parentAccount,
              accountAddress,
              onSuccess,
              onError,
              onCancel,
            }),
          onSuccess: () => tracking.receiveSuccess(manifest),
          onFail: () => tracking.receiveFail(manifest),
        }),
      tokenCurrency,
    );
  };
}
