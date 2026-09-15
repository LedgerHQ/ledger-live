import { combine } from "../combine";

// Mocks created inside the factory (jest hoists jest.mock above imports) and retrieved via
// requireMock. A single shared `combine`/`finalizeAllInputs` jest.fn is returned for every parsed
// PSBT, so we can assert the crafted instance combined the signed one and finalized.
jest.mock("bitcoinjs-lib", () => {
  const combineFn = jest.fn();
  const finalizeAllInputs = jest.fn();
  const fromBase64 = jest.fn((b64: string) => ({
    b64,
    combine: combineFn,
    finalizeAllInputs,
    extractTransaction: () => ({ toHex: () => "SIGNED_TX_HEX" }),
  }));
  return { Psbt: { fromBase64 } };
});

const { Psbt } = jest.requireMock("bitcoinjs-lib") as { Psbt: { fromBase64: jest.Mock } };

describe("logic/combine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("merges the signed PSBT into the crafted PSBT, finalizes, and returns the raw tx hex", () => {
    const result = combine("UNSIGNED_PSBT", ["SIGNED_PSBT_BASE64"]);

    expect(result).toBe("SIGNED_TX_HEX");
    // both the crafted (unsigned) and the signed PSBT are parsed
    expect(Psbt.fromBase64).toHaveBeenNthCalledWith(1, "UNSIGNED_PSBT");
    expect(Psbt.fromBase64).toHaveBeenNthCalledWith(2, "SIGNED_PSBT_BASE64");
    // the signed PSBT is combined INTO the crafted one, which is then finalized
    const crafted = Psbt.fromBase64.mock.results[0].value;
    const signed = Psbt.fromBase64.mock.results[1].value;
    expect(crafted.combine).toHaveBeenCalledWith(signed);
    expect(crafted.finalizeAllInputs).toHaveBeenCalled();
  });

  it("throws when no signed PSBT is provided", () => {
    expect(() => combine("UNSIGNED_PSBT", [])).toThrow(/expected a signed PSBT/);
  });
});
