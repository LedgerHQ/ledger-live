import BigNumber from "bignumber.js";
import { lastValueFrom } from "rxjs";
import { toArray } from "rxjs/operators";
import { genericSignOperation } from "../signOperation";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { getCoinModuleApi } from "../api";
import { buildOptimisticOperation } from "../utils";

jest.mock("../api", () => ({
  getCoinModuleApi: jest.fn(),
}));

jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  buildOptimisticOperation: jest.fn(),
}));

describe("genericSignOperation", () => {
  const mockSignerContext = jest.fn();
  const mockSigner = {
    getAddress: jest.fn(),
    signTransaction: jest.fn(),
  };

  const transaction = {
    amount: new BigNumber(100_000),
    fees: new BigNumber(500),
    tag: 1234,
    recipient: "rRecipient",
    family: "xrp",
    recipientDomain: {
      domain: "recipient.gen",
      address: "recipient-address",
    },
  } as any;

  const craftTransaction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    craftTransaction.mockResolvedValue({ transaction: "unsignedTx" });
    (getCoinModuleApi as jest.Mock).mockReturnValue({
      craftTransaction,
      getAccountInfo: jest.fn().mockResolvedValue("pubKey"),
      combine: jest.fn().mockResolvedValue("signedTx"),
      getNextSequence: jest.fn().mockResolvedValue(1n),
    });

    (buildOptimisticOperation as jest.Mock).mockReturnValue({ id: "mock-op" });

    mockSigner.getAddress.mockResolvedValue({ publicKey: "pubKey" });
    mockSigner.signTransaction.mockResolvedValue("sig");
    mockSignerContext.mockImplementation(async (_deviceId, cb) => cb(mockSigner));
  });

  const account = {
    freshAddressPath: "44'/144'/0'/0/0",
    freshAddress: "rTestAddress",
    address: "rTestAddress",
    currency: { id: "ripple", name: "ripple", units: [{ name: "ripple", code: "XRP" }] },
  } as any;

  it("emits full sign operation flow and forwards destination tag to craftTransaction", async () => {
    const signOperation = genericSignOperation("mainnet", "xrp")(mockSignerContext);
    const observable = signOperation({ account, transaction, deviceId: "" });

    const events = await lastValueFrom(observable.pipe(toArray()));

    expect(events[0]).toEqual({ type: "device-signature-requested" });
    expect(events[1]).toEqual({ type: "device-signature-granted" });
    expect(events[2]).toEqual({
      type: "signed",
      signedOperation: {
        operation: { id: "mock-op" },
        signature: "signedTx",
      },
    });

    expect(mockSigner.signTransaction).toHaveBeenCalledWith("44'/144'/0'/0/0", "unsignedTx", {
      domain: "recipient.gen",
      address: "recipient-address",
      derivationMode: undefined,
    });
    expect(craftTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        memo: { type: "map", memos: new Map([["destinationTag", "1234"]]) },
      }),
      expect.anything(),
    );
  });

  it("throws FeeNotLoaded if fees are missing", async () => {
    const txWithoutFees = { ...transaction };
    delete txWithoutFees.fees;

    const signOperation = genericSignOperation("mainnet", "xrp")(mockSignerContext);
    const observable = signOperation({ account, transaction: txWithoutFees, deviceId: "" });

    await expect(lastValueFrom(observable)).rejects.toThrow(FeeNotLoaded);
  });
});
