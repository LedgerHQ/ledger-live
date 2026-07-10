import { promisifyUiHandler } from "../promisifyUiHandler";
import { dappPersonalSignLogic } from "../../logic/dapp/personalSign";
import { errors, rejectedError } from "./errors";
import type { DappMessageContext, JsonRpcRequestMessage } from "./types";

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-191.md
// Discussion about the diff between eth_sign and personal_sign:
// https://github.com/WalletConnect/walletconnect-docs/issues/32#issuecomment-644697172
export async function handlePersonalSign(
  { manifest, currentAccount, signerAccount, postMessage, tracking, uiHook }: DappMessageContext,
  data: JsonRpcRequestMessage,
): Promise<void> {
  try {
    const signedMessage = await dappPersonalSignLogic(
      { manifest, account: currentAccount, signerAccount, tracking },
      data.params[0],
      params =>
        promisifyUiHandler<string>({
          invokeUi: ({ onSuccess, onError, onCancel }) =>
            uiHook["message.sign"]({ ...params, onSuccess, onError, onCancel }),
          cancelError: () => new Error("Canceled by user"),
        }),
    );

    postMessage(
      JSON.stringify({
        id: data.id,
        jsonrpc: "2.0",
        result: signedMessage,
      }),
    );
  } catch {
    postMessage(
      JSON.stringify({
        id: data.id,
        jsonrpc: "2.0",
        error: rejectedError(errors.UserRejected, "Personal message signed declined"),
      }),
    );
  }
}
