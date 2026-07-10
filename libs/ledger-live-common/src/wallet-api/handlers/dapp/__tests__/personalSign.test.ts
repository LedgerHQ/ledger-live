import { handlePersonalSign } from "../personalSign";
import type { DappMessageContext, JsonRpcRequestMessage } from "../types";

jest.mock("../../../logic/dapp/personalSign", () => ({
  dappPersonalSignLogic: jest.fn(),
}));

const { dappPersonalSignLogic } = jest.requireMock("../../../logic/dapp/personalSign");

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

const data: JsonRpcRequestMessage = {
  jsonrpc: "2.0",
  method: "personal_sign",
  params: ["0xdeadbeef", "0xSIGNER"],
  id: 2,
};

describe("handlePersonalSign", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the signature from the logic layer", async () => {
    dappPersonalSignLogic.mockResolvedValue("0xsignature");
    const postMessage = jest.fn();

    await handlePersonalSign(buildContext(postMessage), data);

    expect(dappPersonalSignLogic).toHaveBeenCalledWith(
      expect.objectContaining({ manifest: { id: "dapp-1" } }),
      "0xdeadbeef",
      expect.any(Function),
    );
    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({ id: 2, jsonrpc: "2.0", result: "0xsignature" }),
    );
  });

  it("responds with a UserRejected error when the logic throws", async () => {
    dappPersonalSignLogic.mockRejectedValue(new Error("Canceled by user"));
    const postMessage = jest.fn();

    await handlePersonalSign(buildContext(postMessage), data);

    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        id: 2,
        jsonrpc: "2.0",
        error: {
          code: 4001,
          message: "Personal message signed declined",
          data: { code: 4001, message: "Personal message signed declined" },
        },
      }),
    );
  });
});
