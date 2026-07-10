import { handleEthSendTransaction } from "../ethSendTransaction";
import type { DappMessageContext, JsonRpcRequestMessage } from "../types";

jest.mock("../../../logic/dapp/sendTransaction", () => ({
  dappSendTransactionLogic: jest.fn(),
}));

const { dappSendTransactionLogic } = jest.requireMock("../../../logic/dapp/sendTransaction");

function buildContext(postMessage: jest.Mock): DappMessageContext {
  return {
    manifest: { id: "dapp-1" },
    currentAccount: { id: "acc-1" },
    signerAccount: { freshAddress: "0xABCDEF" },
    currentNetwork: { chainID: 1 },
    postMessage,
    tracking: {},
    uiHook: { "transaction.sign": jest.fn(), "transaction.broadcast": jest.fn() },
  } as unknown as DappMessageContext;
}

function sendTx(from: string, id = 1): JsonRpcRequestMessage {
  return { jsonrpc: "2.0", method: "eth_sendTransaction", params: [{ from, to: "0xTO" }], id };
}

describe("handleEthSendTransaction", () => {
  beforeEach(() => jest.clearAllMocks());

  it("signs and returns the tx hash when the from address matches the signer (case-insensitive)", async () => {
    dappSendTransactionLogic.mockResolvedValue("0xhash");
    const postMessage = jest.fn();

    // signer is 0xABCDEF, request uses lowercase — must still match
    await handleEthSendTransaction(buildContext(postMessage), sendTx("0xabcdef", 9));

    expect(dappSendTransactionLogic).toHaveBeenCalled();
    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({ id: 9, jsonrpc: "2.0", result: "0xhash" }),
    );
  });

  it("is a silent no-op when the from address does not match the signer", async () => {
    const postMessage = jest.fn();

    await handleEthSendTransaction(buildContext(postMessage), sendTx("0xdifferent"));

    expect(dappSendTransactionLogic).not.toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("responds with a UserRejected error when the logic throws", async () => {
    dappSendTransactionLogic.mockRejectedValue(new Error("declined"));
    const postMessage = jest.fn();

    await handleEthSendTransaction(buildContext(postMessage), sendTx("0xabcdef", 3));

    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        id: 3,
        jsonrpc: "2.0",
        error: {
          code: 4001,
          message: "Transaction declined",
          data: { code: 4001, message: "Transaction declined" },
        },
      }),
    );
  });
});
