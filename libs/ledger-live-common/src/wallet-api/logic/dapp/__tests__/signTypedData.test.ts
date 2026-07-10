import { dappSignTypedDataLogic } from "../signTypedData";
import type { DappSignMessageContext } from "../types";

jest.mock("../../../../hw/signMessage/index", () => ({
  prepareMessageToSign: jest.fn(),
}));

jest.mock("../../../blindSigningContext", () => ({
  withLiveAppContext: jest.fn((_manifest: unknown, fn: () => unknown) => fn()),
}));

const { prepareMessageToSign } = jest.requireMock("../../../../hw/signMessage/index");

function buildContext(overrides: Partial<DappSignMessageContext> = {}): DappSignMessageContext {
  const tracking = {
    dappSignTypedDataRequested: jest.fn(),
    dappSignTypedDataSuccess: jest.fn(),
    dappSignTypedDataFail: jest.fn(),
  };
  return {
    manifest: { id: "dapp-1" } as never,
    account: { id: "acc", freshAddress: "0xACC" } as never,
    signerAccount: { type: "Account", freshAddress: "0xSIGNER" } as never,
    tracking: tracking as never,
    ...overrides,
  };
}

describe("dappSignTypedDataLogic", () => {
  beforeEach(() => jest.clearAllMocks());

  it("hex-encodes the raw message before preparing it and returns the signature", async () => {
    const formatted = { type: "eip712", message: {} };
    prepareMessageToSign.mockResolvedValue(formatted);
    const context = buildContext();
    const signMessage = jest.fn().mockResolvedValue("0xtypedsig");
    const rawMessage = '{"types":{},"domain":{},"message":{}}';

    const result = await dappSignTypedDataLogic(context, rawMessage, signMessage);

    expect(result).toBe("0xtypedsig");
    expect(prepareMessageToSign).toHaveBeenCalledWith(
      context.signerAccount,
      Buffer.from(rawMessage).toString("hex"),
    );
    expect(signMessage).toHaveBeenCalledWith(
      expect.objectContaining({ account: context.account, message: formatted }),
    );
    expect(context.tracking.dappSignTypedDataRequested).toHaveBeenCalledWith(context.manifest);
    expect(context.tracking.dappSignTypedDataSuccess).toHaveBeenCalledWith(context.manifest);
  });

  it("tracks the failure and rethrows when signing rejects", async () => {
    prepareMessageToSign.mockResolvedValue({ type: "eip712", message: {} });
    const context = buildContext();
    const signMessage = jest.fn().mockRejectedValue(new Error("declined"));

    await expect(dappSignTypedDataLogic(context, "{}", signMessage)).rejects.toThrow("declined");
    expect(context.tracking.dappSignTypedDataFail).toHaveBeenCalledWith(context.manifest);
    expect(context.tracking.dappSignTypedDataSuccess).not.toHaveBeenCalled();
  });
});
