const mockValidateAddress = jest.fn();
const mockValidatePublicKey = jest.fn();
const mockDerivePrincipalFromPubkey = jest.fn();
const mockGetCanisterIdlFunc = jest.fn();
const mockEncodeCanisterIdlFunc = jest.fn();
const mockAccountFromHex = jest.fn();
const mockPrincipalFrom = jest.fn();
const mockExpiryFromDelta = jest.fn();

jest.mock("./validation", () => ({
  validateAddress: (...args: unknown[]) => mockValidateAddress(...args),
}));

jest.mock("./public-key", () => ({
  validatePublicKey: (...args: unknown[]) => mockValidatePublicKey(...args),
  derivePrincipalFromPubkey: (...args: unknown[]) => mockDerivePrincipalFromPubkey(...args),
}));

jest.mock("./candid", () => ({
  ledgerIdlFactory: "mock-ledger-idl-factory",
  getCanisterIdlFunc: (...args: unknown[]) => mockGetCanisterIdlFunc(...args),
  encodeCanisterIdlFunc: (...args: unknown[]) => mockEncodeCanisterIdlFunc(...args),
}));

jest.mock("@icp-sdk/canisters/ledger/icp", () => ({
  AccountIdentifier: {
    fromHex: (...args: unknown[]) => mockAccountFromHex(...args),
  },
}));

jest.mock("@icp-sdk/core/principal", () => ({
  Principal: {
    from: (...args: unknown[]) => mockPrincipalFrom(...args),
  },
}));

jest.mock("@icp-sdk/core/agent", () => ({
  Cbor: {},
  Expiry: {
    fromDeltaInMilliseconds: (...args: unknown[]) => mockExpiryFromDelta(...args),
  },
  SubmitRequestType: {
    Call: "call",
  },
}));

import { createUnsignedSendTransaction } from "./transfer";

describe("createUnsignedSendTransaction", () => {
  const validPubKey = "02" + "a".repeat(64);
  const validRecipient = "a".repeat(64);

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateAddress.mockReturnValue({ isValid: true });
    mockValidatePublicKey.mockReturnValue(undefined);
    mockAccountFromHex.mockReturnValue({
      toUint8Array: () => new Uint8Array([1, 2, 3]),
    });
    mockGetCanisterIdlFunc.mockReturnValue("mock-idl-func");
    mockEncodeCanisterIdlFunc.mockReturnValue(new Uint8Array([4, 5, 6]));
    mockPrincipalFrom.mockReturnValue("mock-canister-principal");
    mockDerivePrincipalFromPubkey.mockReturnValue("mock-sender-principal");
    mockExpiryFromDelta.mockReturnValue("mock-expiry");
  });

  it("should create an unsigned transaction with correct structure", () => {
    const { unsignedTransaction, transferRawRequest } = createUnsignedSendTransaction(
      { recipient: validRecipient, amount: BigInt(100000000) },
      validPubKey,
    );

    expect(unsignedTransaction).toEqual({
      request_type: "call",
      canister_id: "mock-canister-principal",
      method_name: "transfer",
      arg: expect.any(Uint8Array),
      sender: "mock-sender-principal",
      ingress_expiry: "mock-expiry",
    });

    expect(transferRawRequest.amount).toEqual({ e8s: BigInt(100000000) });
    expect(transferRawRequest.fee).toEqual({ e8s: BigInt(10000) });
    expect(transferRawRequest.memo).toBe(BigInt(0));
    expect(transferRawRequest.from_subaccount).toEqual([]);
  });

  it("should use the provided memo", () => {
    const { transferRawRequest } = createUnsignedSendTransaction(
      { recipient: validRecipient, amount: BigInt(100000000), memo: 42 },
      validPubKey,
    );

    expect(transferRawRequest.memo).toBe(BigInt(42));
  });

  it("should default memo to 0 when not provided", () => {
    const { transferRawRequest } = createUnsignedSendTransaction(
      { recipient: validRecipient, amount: BigInt(100000000) },
      validPubKey,
    );

    expect(transferRawRequest.memo).toBe(BigInt(0));
  });

  it("should accept amount as string", () => {
    const { transferRawRequest } = createUnsignedSendTransaction(
      { recipient: validRecipient, amount: "500000000" },
      validPubKey,
    );

    expect(transferRawRequest.amount).toEqual({ e8s: BigInt(500000000) });
  });

  it("should throw when recipient address is invalid", () => {
    mockValidateAddress.mockReturnValue({ isValid: false, error: "Bad address" });

    expect(() =>
      createUnsignedSendTransaction({ recipient: "bad-address", amount: BigInt(100) }, validPubKey),
    ).toThrow("Bad address");
  });

  it("should throw with default error when address validation fails without message", () => {
    mockValidateAddress.mockReturnValue({ isValid: false });

    expect(() =>
      createUnsignedSendTransaction({ recipient: "bad-address", amount: BigInt(100) }, validPubKey),
    ).toThrow("Invalid recipient address");
  });

  it("should call validatePublicKey with the provided public key", () => {
    createUnsignedSendTransaction({ recipient: validRecipient, amount: BigInt(100) }, validPubKey);

    expect(mockValidatePublicKey).toHaveBeenCalledWith(validPubKey);
  });

  it("should call getCanisterIdlFunc with ledger factory and transfer method", () => {
    createUnsignedSendTransaction({ recipient: validRecipient, amount: BigInt(100) }, validPubKey);

    expect(mockGetCanisterIdlFunc).toHaveBeenCalledWith("mock-ledger-idl-factory", "transfer");
  });

  it("should set created_at_time with current timestamp in nanoseconds", () => {
    const now = 1700000000000;
    jest.spyOn(Date.prototype, "getTime").mockReturnValue(now);

    const { transferRawRequest } = createUnsignedSendTransaction(
      { recipient: validRecipient, amount: BigInt(100) },
      validPubKey,
    );

    expect(transferRawRequest.created_at_time).toEqual([
      { timestamp_nanos: BigInt(now * 1000000) },
    ]);

    jest.restoreAllMocks();
  });
});
