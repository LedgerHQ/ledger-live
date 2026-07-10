import type { AccountLike, AnyMessage } from "@ledgerhq/types-live";
import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { signMessageLogic } from "../logic/signMessage";
import type { HandlerDeps } from "./types";
import { promisifyUiHandler } from "./promisifyUiHandler";

export function createMessageSignHandler(
  getDeps: () => HandlerDeps,
): WalletHandlers["message.sign"] {
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
        promisifyUiHandler<string, Buffer>({
          invokeUi: ({ onSuccess, onError, onCancel }) =>
            uiMessageSign({
              account,
              message,
              options,
              onSuccess,
              onError,
              onCancel,
            }),
          onSuccess: () => tracking.signMessageSuccess(manifest),
          onFail: () => tracking.signMessageFail(manifest),
          mapResult: signature =>
            signature.startsWith("0x")
              ? Buffer.from(signature.replace("0x", ""), "hex")
              : Buffer.from(signature),
          cancelError: () => new UserRefusedOnDevice(),
        }),
    );
  };
}
