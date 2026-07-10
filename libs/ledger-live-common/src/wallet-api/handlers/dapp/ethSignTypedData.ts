import { promisifyUiHandler } from "../promisifyUiHandler";
import { dappSignTypedDataLogic } from "../../logic/dapp/signTypedData";
import { errors, rejectedError } from "./errors";
import type { DappMessageContext, JsonRpcRequestMessage } from "./types";

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
export async function handleEthSignTypedData(
  { manifest, currentAccount, signerAccount, postMessage, tracking, uiHook }: DappMessageContext,
  data: JsonRpcRequestMessage,
): Promise<void> {
  try {
    const signedMessage = await dappSignTypedDataLogic(
      { manifest, account: currentAccount, signerAccount, tracking },
      data.params[1],
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
        error: rejectedError(errors.UserRejected, "Typed Data message signed declined"),
      }),
    );
  }
}
