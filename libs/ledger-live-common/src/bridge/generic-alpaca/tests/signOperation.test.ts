import { lastValueFrom } from "rxjs";
import { toArray } from "rxjs/operators";
import { genericSignOperation } from "../signOperation";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { getAlpacaApi } from "../alpaca";
import { buildOptimisticOperation, transactionToIntent } from "../utils";

jest.mock("../alpaca", () => ({
  getAlpacaApi: jest.fn(),
}));

jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  buildOptimisticOperation: jest.fn(),
  transactionToIntent: jest.fn(),
}));

describe("genericSignOperation", () => {
  const mockSignerContext = jest.fn();
  const mockSigner = {
    getAddress: jest.fn(),
    signTransaction: jest.fn(),
  };

  const transaction = {
    amount: 100_000n,
    fees: 500n,
    tag: 1234,
    recipientDomain: {
      domain: "recipient.gen",
      address: "recipient-address",
    },
  } as any;

  const txIntent = {
    memo: {
      type: "map",
      memos: new Map(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (getAlpacaApi as jest.Mock).mockReturnValue({
      craftTransaction: jest.fn().mockResolvedValue({ transaction: "unsignedTx" }),
      getAccountInfo: jest.fn().mockResolvedValue("pubKey"),
      combine: jest.fn().mockResolvedValue("signedTx"),
      getSequence: jest.fn().mockResolvedValue(1n),
    });

    (transactionToIntent as jest.Mock).mockReturnValue(txIntent);
    (buildOptimisticOperation as jest.Mock).mockReturnValue({ id: "mock-op" });

    mockSigner.getAddress.mockResolvedValue({ publicKey: "pubKey" });
    mockSigner.signTransaction.mockResolvedValue("sig");
    mockSignerContext.mockImplementation(async (_deviceId, cb) => cb(mockSigner));
  });

  const account = {
    freshAddressPath: "44'/144'/0'/0/0",
    address: "rTestAddress",
    currency: { id: "testnet" },
  } as any;

  it("emits full sign operation flow", async () => {
    const signOperation = genericSignOperation("testnet", "local")(mockSignerContext);
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

    expect(transactionToIntent).toHaveBeenCalledWith(account, transaction, undefined);
    expect(mockSigner.signTransaction).toHaveBeenCalledWith("44'/144'/0'/0/0", "unsignedTx", {
      domain: "recipient.gen",
      address: "recipient-address",
    });
    expect(txIntent.memo.memos.get("destinationTag")).toBe("1234");
  });

  it("throws FeeNotLoaded if fees are missing", async () => {
    const txWithoutFees = { ...transaction };
    delete txWithoutFees.fees;

    const signOperation = genericSignOperation("testnet", "local")(mockSignerContext);
    const observable = signOperation({ account, transaction: txWithoutFees, deviceId: "" });

    await expect(lastValueFrom(observable)).rejects.toThrow(FeeNotLoaded);
  });
});
