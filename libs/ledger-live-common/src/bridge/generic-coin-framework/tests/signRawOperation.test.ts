import { lastValueFrom, of } from "rxjs";
import { toArray } from "rxjs/operators";
import { genericSignRawOperation } from "../signRawOperation";
import { getCoinModuleApi } from "../api";
import { getBridgeApi } from "../bridge";

jest.mock("../api", () => ({
  getCoinModuleApi: jest.fn(),
}));

jest.mock("../bridge", () => ({
  getBridgeApi: jest.fn(),
}));

describe("genericSignRawOperation", () => {
  const account = {
    id: "js:2:ripple:rTestAddress:",
    freshAddressPath: "44'/144'/0'/0/0",
    freshAddress: "rTestAddress",
    currency: { id: "ripple", family: "xrp", units: [{ code: "XRP" }] },
  } as any;

  const craftRawTransaction = jest.fn().mockResolvedValue({ transaction: "unsignedTx" });
  const combine = jest.fn().mockResolvedValue("signedTx");
  const signer = {
    getAddress: jest.fn().mockResolvedValue({ publicKey: "pubKey" }),
    signTransaction: jest.fn().mockResolvedValue("sig"),
  };
  const signerContext = jest.fn(async (_deviceId, cb) => cb(signer));

  beforeEach(() => {
    jest.clearAllMocks();
    (getCoinModuleApi as jest.Mock).mockReturnValue({
      craftRawTransaction,
      combine,
      getNextSequence: jest.fn().mockResolvedValue(1n),
    });
  });

  it("should craft, sign and combine the raw transaction", async () => {
    (getBridgeApi as jest.Mock).mockResolvedValue({});

    const events = await lastValueFrom(
      genericSignRawOperation(
        "ripple",
        "local",
      )(signerContext)({
        account,
        transaction: "rawTx",
        deviceId: "",
      }).pipe(toArray()),
    );

    expect(craftRawTransaction).toHaveBeenCalledWith(
      expect.anything(),
      "rawTx",
      "rTestAddress",
      "pubKey",
      1n,
    );
    expect(combine).toHaveBeenCalledWith(expect.anything(), "unsignedTx", ["sig"], {
      pubkey: "pubKey",
    });
    const signed = events.find(e => e.type === "signed");
    expect(signed).toMatchObject({ signedOperation: { signature: "signedTx" } });
  });

  it("should hand the request to the family's signRawOperation when present", async () => {
    const signed = { type: "signed", signedOperation: { signature: "detached" } };
    const signRawOperation = jest.fn().mockReturnValue(of(signed));
    (getBridgeApi as jest.Mock).mockResolvedValue({ signRawOperation });

    const events = await lastValueFrom(
      genericSignRawOperation(
        "ripple",
        "local",
      )(signerContext)({ account, transaction: "rawTx", deviceId: "d" }).pipe(toArray()),
    );

    expect(signRawOperation).toHaveBeenCalledWith({ account, transaction: "rawTx", deviceId: "d" });
    expect(events).toEqual([signed]);
    expect(getCoinModuleApi).not.toHaveBeenCalled();
    expect(signerContext).not.toHaveBeenCalled();
  });
});
