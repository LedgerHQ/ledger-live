import { SignerEntry } from "../types";
import { cachedRecipientIsNew, sortSignersByNumericAddress } from "./utils";

// We'll mock ripple-address-codec so that we control numeric ordering via decodeAccountID
// without re-implementing the util's logic inside the tests.
const decodeAccountIDMock = jest.fn((account: string) => {
  // Provide deterministic 20-byte arrays whose last byte encodes the numeric ordering.
  // (Big-endian comparison means earlier bytes are 0; ordering driven by final byte value.)
  const bytes = new Uint8Array(20).fill(0);
  const ordering: Record<string, number> = { alpha: 1, gamma: 2, beta: 3, epsilon: 4, delta: 5 };
  if (ordering[account]) bytes[19] = ordering[account];
  return bytes;
});

jest.mock("ripple-address-codec", () => ({
  isValidClassicAddress: () => true,
  decodeAccountID: (address: string) => decodeAccountIDMock(address),
}));
const mockGetAccountInfo = jest.fn();
jest.mock("../network", () => ({
  getAccountInfo: (address: string) => mockGetAccountInfo(address),
}));

describe("cachedRecipientIsNew", () => {
  afterEach(() => {
    mockGetAccountInfo.mockClear();
  });

  it("returns true when network returns a new empty account", async () => {
    // Given
    mockGetAccountInfo.mockResolvedValueOnce({
      isNewAccount: true,
      balance: "0",
      ownerCount: 0,
      sequence: 0,
    });

    // When
    const result = await cachedRecipientIsNew("address1");

    // Then
    expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it("returns false when network a valid AccountInfo", async () => {
    // Given
    mockGetAccountInfo.mockResolvedValueOnce({
      isNewAccount: false,
      balance: "999441667919804",
      ownerCount: 0,
      sequence: 999441667919804,
    });

    // When
    const result = await cachedRecipientIsNew("address2");

    // Then
    expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
  });

  it("throws an error when network throws an error", async () => {
    // Given
    mockGetAccountInfo.mockImplementationOnce(() => {
      throw new Error("Malformed address");
    });

    // When & Then
    await expect(cachedRecipientIsNew("address3")).rejects.toThrow("Malformed address");
    expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
  });
});

// Helper to build a SignerEntry from an Account address
function signer(account: string): SignerEntry {
  return {
    Signer: {
      Account: account,
      SigningPubKey: "PUBKEY",
      TxnSignature: "SIGNATURE",
    },
  };
}

// We intentionally use simple string identifiers (not real XRP addresses) since we fully mock decodeAccountID.
// Numeric order (smallest->largest) encoded in mock via last byte value: alpha(1), gamma(2), beta(3), epsilon(4), delta(5)
const orderedByNumeric = ["alpha", "gamma", "beta", "epsilon", "delta"];

describe("sortSignersByNumericAddress", () => {
  it("returns an empty array when given an empty array", () => {
    expect(sortSignersByNumericAddress([])).toEqual([]);
  });

  it("does not mutate the original array", () => {
    const original: SignerEntry[] = [signer("beta"), signer("alpha"), signer("delta")];
    const originalSnapshot = original.map(s => s.Signer.Account);
    const result = sortSignersByNumericAddress(original);
    expect(result).not.toBe(original);
    expect(original.map(s => s.Signer.Account)).toEqual(originalSnapshot);
  });

  it("returns new array for single element", () => {
    const single = [signer("alpha")];
    const result = sortSignersByNumericAddress(single);
    expect(result).toHaveLength(1);
    expect(result[0].Signer.Account).toBe("alpha");
    expect(result).not.toBe(single);
  });

  it("sorts by numeric account ID as provided by decodeAccountID mock", () => {
    const shuffled = ["delta", "gamma", "alpha", "epsilon", "beta"]; // random order
    const signers = shuffled.map(a => signer(a));
    const result = sortSignersByNumericAddress(signers).map(s => s.Signer.Account);
    expect(result).toEqual(orderedByNumeric);
    // Ensure decodeAccountID was called for each element at least once
    orderedByNumeric.forEach(addr => {
      expect(decodeAccountIDMock).toHaveBeenCalledWith(addr);
    });
  });

  it("ordering differs from naive lexicographic string sort", () => {
    const signers = ["alpha", "beta", "delta", "epsilon", "gamma"].map(a => signer(a));
    const numericSorted = sortSignersByNumericAddress(signers).map(s => s.Signer.Account);
    const lexSorted = signers.map(s => s.Signer.Account).sort();
    // Our predetermined numeric order should not equal simple lexical sort (which puts beta before gamma)
    expect(numericSorted).toEqual(orderedByNumeric);
    expect(numericSorted).not.toEqual(lexSorted);
  });
});
