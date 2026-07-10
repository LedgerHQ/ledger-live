import { handleWalletSwitchEthereumChain } from "../walletSwitchEthereumChain";
import type { DappMessageContext, JsonRpcRequestMessage } from "../types";

jest.mock("../../../logic/dapp/switchEthereumChain", () => ({
  dappSwitchEthereumChainLogic: jest.fn(),
}));

const { dappSwitchEthereumChainLogic } = jest.requireMock(
  "../../../logic/dapp/switchEthereumChain",
);

function buildContext(postMessage: jest.Mock): DappMessageContext {
  return {
    manifest: {
      id: "dapp-1",
      dapp: { networks: [{ currency: "ethereum", chainID: 1 }] },
    },
    postMessage,
    uiHook: { "account.request": jest.fn() },
    setCurrentAccount: jest.fn(),
    setCurrentAccountHist: jest.fn(),
  } as unknown as DappMessageContext;
}

function switchTo(chainId: string, id = 1): JsonRpcRequestMessage {
  return { jsonrpc: "2.0", method: "wallet_switchEthereumChain", params: [{ chainId }], id };
}

describe("handleWalletSwitchEthereumChain", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects a non-hex chainId with InvalidParams", async () => {
    const postMessage = jest.fn();

    await handleWalletSwitchEthereumChain(buildContext(postMessage), switchTo("nonsense", 2));

    expect(dappSwitchEthereumChainLogic).not.toHaveBeenCalled();
    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        id: 2,
        jsonrpc: "2.0",
        error: {
          code: -32602,
          message: "Invalid chainId",
          data: { code: -32602, message: "Invalid chainId" },
        },
      }),
    );
  });

  it("rejects an unknown chainId with InvalidParams", async () => {
    const postMessage = jest.fn();

    // 0x5 = 5, not present in the manifest networks
    await handleWalletSwitchEthereumChain(buildContext(postMessage), switchTo("0x5", 3));

    expect(dappSwitchEthereumChainLogic).not.toHaveBeenCalled();
    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        id: 3,
        jsonrpc: "2.0",
        error: {
          code: -32602,
          message: "Chain ID 0x5 is not supported",
          data: { code: -32602, message: "Chain ID 0x5 is not supported" },
        },
      }),
    );
  });

  it("resolves with null when the switch succeeds", async () => {
    dappSwitchEthereumChainLogic.mockResolvedValue(undefined);
    const postMessage = jest.fn();

    await handleWalletSwitchEthereumChain(buildContext(postMessage), switchTo("0x1", 4));

    expect(dappSwitchEthereumChainLogic).toHaveBeenCalledWith(
      expect.any(Object),
      { currency: "ethereum", chainID: 1 },
      expect.any(Function),
    );
    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({ id: 4, jsonrpc: "2.0", result: null }),
    );
  });

  it("responds with a UserRejected error when the switch is canceled", async () => {
    dappSwitchEthereumChainLogic.mockRejectedValue("User canceled");
    const postMessage = jest.fn();

    await handleWalletSwitchEthereumChain(buildContext(postMessage), switchTo("0x1", 5));

    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        id: 5,
        jsonrpc: "2.0",
        error: {
          code: 4001,
          message: "error switching chain: User canceled",
          data: { code: 4001, message: "error switching chain: User canceled" },
        },
      }),
    );
  });
});
