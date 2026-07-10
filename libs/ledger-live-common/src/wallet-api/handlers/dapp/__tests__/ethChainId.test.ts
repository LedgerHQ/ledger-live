import { handleEthChainId } from "../ethChainId";
import type { DappMessageContext } from "../types";

describe("handleEthChainId", () => {
  it("responds with the current network chainID as a hex string", () => {
    const postMessage = jest.fn();
    const context = {
      currentNetwork: { chainID: 137 },
      postMessage,
    } as unknown as DappMessageContext;

    handleEthChainId(context, { jsonrpc: "2.0", method: "eth_chainId", id: 7 });

    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({ id: 7, jsonrpc: "2.0", result: "0x89" }),
    );
  });
});
