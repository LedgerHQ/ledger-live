import { handleRpcPassthrough } from "../rpcPassthrough";
import type { DappMessageContext } from "../types";

jest.mock("@ledgerhq/live-network/network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const network = jest.requireMock("@ledgerhq/live-network/network").default as jest.Mock;

const data = { jsonrpc: "2.0", method: "eth_blockNumber", id: 5 } as const;

describe("handleRpcPassthrough", () => {
  beforeEach(() => jest.clearAllMocks());

  it("forwards over the websocket when one is open", () => {
    const send = jest.fn();
    const postMessage = jest.fn();
    const context = {
      currentNetwork: { nodeURL: "https://node" },
      postMessage,
      wsRef: { current: { send } },
    } as unknown as DappMessageContext;

    handleRpcPassthrough(context, data);

    expect(send).toHaveBeenCalledWith(data);
    expect(network).not.toHaveBeenCalled();
  });

  it("POSTs to the https node and relays the response when there is no websocket", async () => {
    network.mockResolvedValue({ data: { id: 5, result: "0x1" } });
    const postMessage = jest.fn();
    const context = {
      currentNetwork: { nodeURL: "https://node.example" },
      postMessage,
      wsRef: { current: undefined },
    } as unknown as DappMessageContext;

    handleRpcPassthrough(context, data);
    await Promise.resolve();
    await Promise.resolve();

    expect(network).toHaveBeenCalledWith({ method: "POST", url: "https://node.example", data });
    expect(postMessage).toHaveBeenCalledWith(JSON.stringify({ id: 5, result: "0x1" }));
  });

  it("does nothing when there is no websocket and the node URL is not https", () => {
    const postMessage = jest.fn();
    const context = {
      currentNetwork: { nodeURL: "ws://node" },
      postMessage,
      wsRef: { current: undefined },
    } as unknown as DappMessageContext;

    handleRpcPassthrough(context, data);

    expect(network).not.toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalled();
  });
});
