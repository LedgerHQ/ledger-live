import { dappPersonalSignLogic } from "../personalSign";
import type { DappSignMessageContext } from "../types";

jest.mock("../../../../hw/signMessage/index", () => ({
  prepareMessageToSign: jest.fn(),
}));

// withLiveAppContext scoping is covered by the useDappLogic integration test;
// here we make it a passthrough so we can assert the logic function in isolation.
jest.mock("../../../blindSigningContext", () => ({
  withLiveAppContext: jest.fn((_manifest: unknown, fn: () => unknown) => fn()),
}));

const { prepareMessageToSign } = jest.requireMock("../../../../hw/signMessage/index");
const { withLiveAppContext } = jest.requireMock("../../../blindSigningContext");

function buildContext(overrides: Partial<DappSignMessageContext> = {}): DappSignMessageContext {
  const tracking = {
    dappPersonalSignRequested: jest.fn(),
    dappPersonalSignSuccess: jest.fn(),
    dappPersonalSignFail: jest.fn(),
  };
  return {
    manifest: { id: "dapp-1" } as never,
    account: { id: "token-acc", freshAddress: "0xTOKEN" } as never,
    signerAccount: { type: "Account", freshAddress: "0xSIGNER" } as never,
    tracking: tracking as never,
    ...overrides,
  };
}

describe("dappPersonalSignLogic", () => {
  beforeEach(() => jest.clearAllMocks());

  it("strips the hex prefix, prepares the message with the signer account, and returns the signature", async () => {
    const formatted = { type: "message", message: "deadbeef" };
    prepareMessageToSign.mockResolvedValue(formatted);
    const context = buildContext();
    const signMessage = jest.fn().mockResolvedValue("0xsignature");

    const result = await dappPersonalSignLogic(context, "0xdeadbeef", signMessage);

    expect(result).toBe("0xsignature");
    // "0x" prefix stripped before prepareMessageToSign
    expect(prepareMessageToSign).toHaveBeenCalledWith(context.signerAccount, "deadbeef");
    // signs against the (possibly token) account, not the signer account
    expect(signMessage).toHaveBeenCalledWith(
      expect.objectContaining({ account: context.account, message: formatted }),
    );
    expect(context.tracking.dappPersonalSignRequested).toHaveBeenCalledWith(context.manifest);
    expect(context.tracking.dappPersonalSignSuccess).toHaveBeenCalledWith(context.manifest);
    expect(context.tracking.dappPersonalSignFail).not.toHaveBeenCalled();
  });

  it("passes hwAppId/dependencies options when the manifest declares a nanoApp", async () => {
    prepareMessageToSign.mockResolvedValue({ type: "message", message: "ab" });
    const context = buildContext({
      manifest: { id: "dapp-1", dapp: { nanoApp: "Ethereum", dependencies: ["Foo"] } } as never,
    });
    const signMessage = jest.fn().mockResolvedValue("0xsig");

    await dappPersonalSignLogic(context, "0xab", signMessage);

    expect(signMessage).toHaveBeenCalledWith(
      expect.objectContaining({ options: { hwAppId: "Ethereum", dependencies: ["Foo"] } }),
    );
    expect(withLiveAppContext).toHaveBeenCalledWith(context.manifest, expect.any(Function));
  });

  it("uses undefined options when no nanoApp is declared", async () => {
    prepareMessageToSign.mockResolvedValue({ type: "message", message: "ab" });
    const context = buildContext();
    const signMessage = jest.fn().mockResolvedValue("0xsig");

    await dappPersonalSignLogic(context, "0xab", signMessage);

    expect(signMessage).toHaveBeenCalledWith(expect.objectContaining({ options: undefined }));
  });

  it("tracks the failure and rethrows when signing rejects", async () => {
    prepareMessageToSign.mockResolvedValue({ type: "message", message: "ab" });
    const context = buildContext();
    const error = new Error("Canceled by user");
    const signMessage = jest.fn().mockRejectedValue(error);

    await expect(dappPersonalSignLogic(context, "0xab", signMessage)).rejects.toThrow(
      "Canceled by user",
    );
    expect(context.tracking.dappPersonalSignFail).toHaveBeenCalledWith(context.manifest);
    expect(context.tracking.dappPersonalSignSuccess).not.toHaveBeenCalled();
  });
});
