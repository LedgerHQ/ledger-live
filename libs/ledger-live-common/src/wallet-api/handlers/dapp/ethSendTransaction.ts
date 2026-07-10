import type { SignedOperation } from "@ledgerhq/types-live";
import { promisifyUiHandler } from "../promisifyUiHandler";
import { dappSendTransactionLogic } from "../../logic/dapp/sendTransaction";
import { errors, rejectedError } from "./errors";
import type { DappMessageContext, JsonRpcRequestMessage } from "./types";

// https://eth.wiki/json-rpc/API#eth_sendtransaction
export async function handleEthSendTransaction(
  context: DappMessageContext,
  data: JsonRpcRequestMessage,
): Promise<void> {
  const { manifest, currentAccount, signerAccount, currentNetwork, postMessage, tracking, uiHook } =
    context;
  const { mevProtected, referrer } = context;
  const ethTX = data.params[0];
  const address = signerAccount.freshAddress;

  if (address.toLowerCase() === ethTX.from.toLowerCase()) {
    try {
      const hash = await dappSendTransactionLogic(
        {
          manifest,
          account: currentAccount,
          chainID: currentNetwork.chainID,
          tracking,
          mevProtected,
          referrer,
        },
        ethTX,
        params =>
          promisifyUiHandler<SignedOperation>({
            invokeUi: ({ onSuccess, onError }) =>
              uiHook["transaction.sign"]({ ...params, onSuccess, onError }),
          }),
        (mainAccount, optimisticOperation) =>
          uiHook["transaction.broadcast"](
            currentAccount,
            undefined,
            mainAccount,
            optimisticOperation,
          ),
      );

      postMessage(
        JSON.stringify({
          id: data.id,
          jsonrpc: "2.0",
          result: hash,
        }),
      );
    } catch {
      postMessage(
        JSON.stringify({
          id: data.id,
          jsonrpc: "2.0",
          error: rejectedError(errors.UserRejected, "Transaction declined"),
        }),
      );
    }
  }
}
