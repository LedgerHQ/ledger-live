import type { DappMessageContext, JsonRpcRequestMessage } from "./types";

// https://eips.ethereum.org/EIPS/eip-695
export function handleEthChainId(
  { currentNetwork, postMessage }: DappMessageContext,
  data: JsonRpcRequestMessage,
): void {
  postMessage(
    JSON.stringify({
      id: data.id,
      jsonrpc: "2.0",
      result: `0x${currentNetwork.chainID.toString(16)}`,
    }),
  );
}
