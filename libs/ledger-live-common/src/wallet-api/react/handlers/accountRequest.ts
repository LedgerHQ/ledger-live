import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import { accountToWalletAPIAccount } from "../../converters";
import type { HandlerDeps } from "../types";

export function createAccountRequestHandler(getDeps: () => HandlerDeps): WalletHandlers["account.request"] {
  return async ({
    currencyIds,
    drawerConfiguration,
    areCurrenciesFiltered,
    useCase,
    uiUseCase,
  }) => {
    const { uiAccountRequest, tracking, manifest, walletState } = getDeps();
    if (!uiAccountRequest) {
      throw new Error("account.request UI handler not configured");
    }

    tracking.requestAccountRequested(manifest);
    return new Promise((resolve, reject) => {
      let done = false;
      try {
        uiAccountRequest({
          currencyIds,
          drawerConfiguration,
          areCurrenciesFiltered,
          useCase,
          uiUseCase,
          onSuccess: (account: AccountLike, parentAccount: Account | undefined) => {
            if (done) return;
            done = true;
            tracking.requestAccountSuccess(manifest);
            resolve(accountToWalletAPIAccount(walletState, account, parentAccount));
          },
          onCancel: () => {
            if (done) return;
            done = true;
            tracking.requestAccountFail(manifest);
            reject(new Error("Canceled by user"));
          },
        });
      } catch (error) {
        tracking.requestAccountFail(manifest);
        reject(error);
      }
    });
  };
}
