const mockFromRaw = jest.fn();
const mockToDer = jest.fn();
const mockSelfAuthenticating = jest.fn();
const mockFromPrincipal = jest.fn();
const mockToHex = jest.fn();

jest.mock("@icp-sdk/core/identity/secp256k1", () => ({
  Secp256k1PublicKey: {
    fromRaw: (...args: unknown[]) => mockFromRaw(...args),
  },
}));

jest.mock("@icp-sdk/core/agent", () => ({}));

jest.mock("@icp-sdk/core/principal", () => ({
  Principal: {
    selfAuthenticating: (...args: unknown[]) => mockSelfAuthenticating(...args),
  },
}));

jest.mock("@icp-sdk/canisters/ledger/icp", () => ({
  AccountIdentifier: {
    fromPrincipal: (...args: unknown[]) => mockFromPrincipal(...args),
  },
}));

import {
  validatePublicKey,
  derivePrincipalFromPubkey,
  deriveAddressFromPubkey,
  pubkeyToDer,
} from "./public-key";

describe("validatePublicKey", () => {
  it("should accept a valid 33-byte compressed public key", () => {
    const key = "02" + "a".repeat(64);
    expect(() => validatePublicKey(key)).not.toThrow();
  });

  it("should accept a valid 65-byte uncompressed public key", () => {
    const key = "04" + "b".repeat(128);
    expect(() => validatePublicKey(key)).not.toThrow();
  });

  it("should throw for empty string", () => {
    expect(() => validatePublicKey("")).toThrow("Public key must be a non-empty string");
  });

  it("should throw for non-string input", () => {
    expect(() => validatePublicKey(null as unknown as string)).toThrow(
      "Public key must be a non-empty string",
    );
  });

  it("should throw for undefined input", () => {
    expect(() => validatePublicKey(undefined as unknown as string)).toThrow(
      "Public key must be a non-empty string",
    );
  });

  it("should throw for invalid hex characters", () => {
    const key = "zz" + "a".repeat(64);
    expect(() => validatePublicKey(key)).toThrow("Public key must be a valid hex string");
  });

  it("should throw for wrong length (too short)", () => {
    expect(() => validatePublicKey("02abcd")).toThrow(/must be 33 bytes.*or 65 bytes/);
  });

  it("should throw for wrong length (between 33 and 65 bytes)", () => {
    const key = "a".repeat(80);
    expect(() => validatePublicKey(key)).toThrow(/must be 33 bytes.*or 65 bytes.*got 40 bytes/);
  });
});

describe("derivePrincipalFromPubkey", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should derive a principal from a valid public key", () => {
    const validKey = "02" + "a".repeat(64);
    const mockDerBytes = new Uint8Array([1, 2, 3]);
    const mockPrincipal = { toString: () => "mock-principal" };

    mockToDer.mockReturnValue(mockDerBytes);
    mockFromRaw.mockReturnValue({ toDer: mockToDer });
    mockSelfAuthenticating.mockReturnValue(mockPrincipal);

    const result = derivePrincipalFromPubkey(validKey);

    expect(result).toBe(mockPrincipal);
    expect(mockFromRaw).toHaveBeenCalledWith(expect.any(Uint8Array));
    expect(mockSelfAuthenticating).toHaveBeenCalledWith(expect.any(Uint8Array));
  });

  it("should throw for invalid public key", () => {
    expect(() => derivePrincipalFromPubkey("invalid")).toThrow();
  });
});

describe("deriveAddressFromPubkey", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should derive an address from a valid public key", () => {
    const validKey = "02" + "a".repeat(64);
    const mockDerBytes = new Uint8Array([1, 2, 3]);
    const mockPrincipal = { toString: () => "mock-principal" };

    mockToDer.mockReturnValue(mockDerBytes);
    mockFromRaw.mockReturnValue({ toDer: mockToDer });
    mockSelfAuthenticating.mockReturnValue(mockPrincipal);
    mockToHex.mockReturnValue("abcd1234");
    mockFromPrincipal.mockReturnValue({ toHex: mockToHex });

    const result = deriveAddressFromPubkey(validKey);

    expect(result).toBe("abcd1234");
    expect(mockFromPrincipal).toHaveBeenCalledWith({ principal: mockPrincipal });
    expect(mockToHex).toHaveBeenCalled();
  });

  it("should throw for invalid public key", () => {
    expect(() => deriveAddressFromPubkey("bad")).toThrow();
  });
});

describe("pubkeyToDer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should convert a valid public key to DER encoding", () => {
    const validKey = "02" + "a".repeat(64);
    const mockDerResult = new ArrayBuffer(10);

    mockToDer.mockReturnValue(mockDerResult);
    mockFromRaw.mockReturnValue({ toDer: mockToDer });

    const result = pubkeyToDer(validKey);

    expect(result).toBe(mockDerResult);
    expect(mockFromRaw).toHaveBeenCalledWith(expect.any(Uint8Array));
    expect(mockToDer).toHaveBeenCalled();
  });

  it("should throw for invalid public key", () => {
    expect(() => pubkeyToDer("")).toThrow();
  });
});
