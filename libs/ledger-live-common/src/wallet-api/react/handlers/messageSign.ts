import type { AccountLike, AnyMessage } from "@ledgerhq/types-live";
import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { signMessageLogic } from "../../logic/signMessage";
import type { HandlerDeps } from "../types";

export function createMessageSignHandler(getDeps: () => HandlerDeps): WalletHandlers["message.sign"] {
  return ({ accountId, message, options }) => {
    const { uiMessageSign, manifest, accounts, tracking } = getDeps();
    if (!uiMessageSign) {
      throw new Error("message.sign UI handler not configured");
    }

    return signMessageLogic(
      { manifest, accounts, tracking },
      accountId,
      message.toString("hex"),
      (account: AccountLike, message: AnyMessage) =>
        new Promise((resolve, reject) => {
          let done = false;
          return uiMessageSign({
            account,
            message,
            options,
            onSuccess: signature => {
              if (done) return;
              done = true;
              tracking.signMessageSuccess(manifest);
              resolve(
                signature.startsWith("0x")
                  ? Buffer.from(signature.replace("0x", ""), "hex")
                  : Buffer.from(signature),
              );
            },
            onCancel: () => {
              if (done) return;
              done = true;
              tracking.signMessageFail(manifest);
              reject(new UserRefusedOnDevice());
            },
            onError: error => {
              if (done) return;
              done = true;
              tracking.signMessageFail(manifest);
              reject(error);
            },
          });
        }),
    );
  };
}
