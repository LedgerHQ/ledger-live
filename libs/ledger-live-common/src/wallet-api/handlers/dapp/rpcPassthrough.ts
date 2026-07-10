import network from "@ledgerhq/live-network/network";
import type { DappMessageContext, JsonRpcRequestMessage } from "./types";

/**
 * Default case: forward the raw JSON-RPC request to the network node, either over
 * the open websocket or via an HTTPS POST, and relay the response back.
 */
export function handleRpcPassthrough(
  { currentNetwork, postMessage, wsRef }: DappMessageContext,
  data: JsonRpcRequestMessage,
): void {
  if (wsRef.current) {
    wsRef.current.send(data);
  } else if (currentNetwork.nodeURL?.startsWith("https:")) {
    network({
      method: "POST",
      url: currentNetwork.nodeURL,
      data,
    }).then(res => {
      postMessage(JSON.stringify(res.data));
    });
  }
}
