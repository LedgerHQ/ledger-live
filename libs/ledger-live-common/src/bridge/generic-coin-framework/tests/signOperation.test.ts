import BigNumber from "bignumber.js";
import { lastValueFrom } from "rxjs";
import { toArray } from "rxjs/operators";
import { genericSignOperation } from "../signOperation";
import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
import { getCoinModuleApi } from "../api";
import { getBridgeApi } from "../bridge";
import { buildOptimisticOperation } from "../utils";

jest.mock("../api", () => ({
  getCoinModuleApi: jest.fn(),
}));

jest.mock("../bridge", () => ({
  getBridgeApi: jest.fn(),
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
  // The framework threads a context and calls `craftTransactionData(context, intent)`; mirror the
  // default impl (`{ type: "none" }`).
  const craftTransactionData = () => ({ type: "none" });

  beforeEach(() => {
    jest.clearAllMocks();

    craftTransaction.mockResolvedValue({ transaction: "unsignedTx" });
    (getCoinModuleApi as jest.Mock).mockReturnValue({
      craftTransaction,
      craftTransactionData,
      getAccountInfo: jest.fn().mockResolvedValue("pubKey"),
      combine: jest.fn().mockResolvedValue("signedTx"),
      getNextSequence: jest.fn().mockResolvedValue(1n),
    });

    (buildOptimisticOperation as jest.Mock).mockReturnValue({ id: "mock-op" });
    (getBridgeApi as jest.Mock).mockResolvedValue({});

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
      expect.anything(), // context (framework v6)
      expect.objectContaining({
        memo: { type: "map", memos: new Map([["destinationTag", "1234"]]) },
      }),
      expect.anything(),
    );
  });

  it("signs the prepared amount on useAllAmount without recomputing it via validateIntent", async () => {
    const validateIntent = jest.fn();
    (getCoinModuleApi as jest.Mock).mockReturnValue({
      craftTransaction,
      craftTransactionData,
      getAccountInfo: jest.fn().mockResolvedValue("pubKey"),
      combine: jest.fn().mockResolvedValue("signedTx"),
      getNextSequence: jest.fn().mockResolvedValue(1n),
      validateIntent,
    });

    const signOperation = genericSignOperation("mainnet", "xrp")(mockSignerContext);
    const observable = signOperation({
      account,
      transaction: { ...transaction, useAllAmount: true, amount: new BigNumber(100_000) },
      deviceId: "",
    });

    await lastValueFrom(observable.pipe(toArray()));

    expect(validateIntent).not.toHaveBeenCalled();
    expect(craftTransaction).toHaveBeenCalledWith(
      expect.anything(), // context (framework v6)
      expect.objectContaining({ amount: 100000n }),
      expect.anything(),
    );
  });

  it("hands the device signer whatever the family declares", async () => {
    const getDeviceSignOptions = jest
      .fn()
      .mockReturnValue({ familyOwnedSignOption: { id: "asset-1", ledgerSignature: "sig" } });
    (getBridgeApi as jest.Mock).mockResolvedValue({ getDeviceSignOptions });

    const signOperation = genericSignOperation("mainnet", "xrp")(mockSignerContext);
    const observable = signOperation({ account, transaction, deviceId: "" });

    await lastValueFrom(observable.pipe(toArray()));

    expect(mockSigner.signTransaction).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
      expect.objectContaining({ familyOwnedSignOption: { id: "asset-1", ledgerSignature: "sig" } }),
    );
  });

  it("keeps the account's derivationMode when the family declares one of its own", async () => {
    const getDeviceSignOptions = jest.fn().mockReturnValue({ derivationMode: "tezosSecp256k1" });
    (getBridgeApi as jest.Mock).mockResolvedValue({ getDeviceSignOptions });

    const signOperation = genericSignOperation("mainnet", "tezos")(mockSignerContext);
    const observable = signOperation({
      account: { ...account, derivationMode: "tezosbip32-ed25519" },
      transaction,
      deviceId: "",
    });

    await lastValueFrom(observable.pipe(toArray()));

    expect(mockSigner.signTransaction).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
      expect.objectContaining({ derivationMode: "tezosbip32-ed25519" }),
    );
  });

  it("crafts from the family's own intent data", async () => {
    const buildIntentData = jest.fn().mockReturnValue({ type: "familyx" });
    (getBridgeApi as jest.Mock).mockResolvedValue({ buildIntentData });

    const signOperation = genericSignOperation("mainnet", "xrp")(mockSignerContext);
    await lastValueFrom(signOperation({ account, transaction, deviceId: "" }).pipe(toArray()));

    expect(buildIntentData).toHaveBeenCalledWith(transaction);
    expect(craftTransaction).toHaveBeenCalledWith(
      expect.anything(), // context
      expect.objectContaining({ data: { type: "familyx" } }),
      expect.anything(),
    );
  });

  it("hands the family's optimistic-operation descriptor to buildOptimisticOperation", async () => {
    const describeOptimisticOperation = jest.fn();
    (getBridgeApi as jest.Mock).mockResolvedValue({ describeOptimisticOperation });

    const signOperation = genericSignOperation("mainnet", "xrp")(mockSignerContext);
    await lastValueFrom(signOperation({ account, transaction, deviceId: "" }).pipe(toArray()));

    expect(buildOptimisticOperation).toHaveBeenCalledWith(
      account,
      transaction,
      expect.anything(),
      describeOptimisticOperation,
    );
  });

  it("throws FeeNotLoaded if fees are missing", async () => {
    const txWithoutFees = { ...transaction };
    delete txWithoutFees.fees;

    const signOperation = genericSignOperation("mainnet", "xrp")(mockSignerContext);
    const observable = signOperation({ account, transaction: txWithoutFees, deviceId: "" });

    await expect(lastValueFrom(observable)).rejects.toThrow(FeeNotLoaded);
  });

  it("forwards an explicit fee-override marker to craftTransaction, and undefined on the auto path", async () => {
    // LIVE-36865: `transaction.fees` is the auto-resolved display fee, forwarded as customFees.value on
    // every send. Only a deliberate user override carries customFees.parameters.fees, and the framework
    // must relay it so a coin module (TRON's TRC20 fee_limit) can tell an override from the auto value.
    const signOperation = genericSignOperation("mainnet", "xrp")(mockSignerContext);

    // Auto path: no override on the transaction → the module sees no fee marker.
    await lastValueFrom(signOperation({ account, transaction, deviceId: "" }).pipe(toArray()));
    const autoArgs = craftTransaction.mock.calls.at(-1);
    expect(autoArgs[2].customFees.parameters.fees).toBeUndefined();

    // Override path: the marker is forwarded verbatim (deeply converted to bigint).
    await lastValueFrom(
      signOperation({
        account,
        transaction: {
          ...transaction,
          customFees: { parameters: { fees: new BigNumber(30_000_000) } },
        },
        deviceId: "",
      }).pipe(toArray()),
    );
    const overrideArgs = craftTransaction.mock.calls.at(-1);
    expect(overrideArgs[2].customFees.parameters.fees).toBe(30_000_000n);

    // A deliberate 0 override survives the bigint conversion (bigNumberToBigIntDeep drops only undefined,
    // not 0), so it reaches the module as a real override and a 0 fee cap still reaches the chain
    // (VSD-5287/LIVE-36391) rather than falling back to the default ceiling.
    await lastValueFrom(
      signOperation({
        account,
        transaction: { ...transaction, customFees: { parameters: { fees: new BigNumber(0) } } },
        deviceId: "",
      }).pipe(toArray()),
    );
    const zeroOverrideArgs = craftTransaction.mock.calls.at(-1);
    expect(zeroOverrideArgs[2].customFees.parameters.fees).toBe(0n);
  });
});
