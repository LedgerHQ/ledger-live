import { handleEthSignTypedData } from "../ethSignTypedData";
import type { DappMessageContext, JsonRpcRequestMessage } from "../types";

jest.mock("../../../logic/dapp/signTypedData", () => ({
  dappSignTypedDataLogic: jest.fn(),
}));

const { dappSignTypedDataLogic } = jest.requireMock("../../../logic/dapp/signTypedData");

function buildContext(postMessage: jest.Mock): DappMessageContext {
  return {
    manifest: { id: "dapp-1" },
    currentAccount: { id: "acc-1" },
    signerAccount: { freshAddress: "0xSIGNER" },
    postMessage,
    tracking: {},
    uiHook: { "message.sign": jest.fn() },
  } as unknown as DappMessageContext;
}

// eth_signTypedData carries the payload in params[1]
const data: JsonRpcRequestMessage = {
  jsonrpc: "2.0",
  method: "eth_signTypedData_v4",
  params: ["0xSIGNER", '{"types":{}}'],
  id: 4,
};

describe("handleEthSignTypedData", () => {
  beforeEach(() => jest.clearAllMocks());

  it("passes params[1] to the logic and returns the signature", async () => {
    dappSignTypedDataLogic.mockResolvedValue("0xtypedsig");
    const postMessage = jest.fn();

    await handleEthSignTypedData(buildContext(postMessage), data);

    expect(dappSignTypedDataLogic).toHaveBeenCalledWith(
      expect.any(Object),
      '{"types":{}}',
      expect.any(Function),
    );
    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({ id: 4, jsonrpc: "2.0", result: "0xtypedsig" }),
    );
  });

  it("responds with a UserRejected error when the logic throws", async () => {
    dappSignTypedDataLogic.mockRejectedValue(new Error("declined"));
    const postMessage = jest.fn();

    await handleEthSignTypedData(buildContext(postMessage), data);

    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        id: 4,
        jsonrpc: "2.0",
        error: {
          code: 4001,
          message: "Typed Data message signed declined",
          data: { code: 4001, message: "Typed Data message signed declined" },
        },
      }),
    );
  });
});
