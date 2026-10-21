import { tryDecodeSolanaAddress } from "./solanaAddress";

describe("tryDecodeSolanaAddress", () => {
  it("GIVEN a valid base58 address WHEN decoding THEN it returns its 32-byte public key", () => {
    // WHEN
    const result = tryDecodeSolanaAddress("HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8sKyfhW");

    // THEN
    expect(result).toHaveLength(32);
    expect(Buffer.from(result ?? []).toString("hex")).toBe(
      "fbe2244bce876db543a36a6408e241d309f18224a25aa7fd42ef7f08d3e19f65",
    );
  });

  it.each([
    ["a non-base58 character", "HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8sKyfh0"],
    // Valid base58, but only 31 bytes once decoded.
    ["a too-short payload", "7DUeBUtEcb7nujVZRJmeBju3X1mo6PpnWNtJ9EBhdY"],
    ["a Tron address", "TUjT4fqfNmuCq5wnPfgZayswhGTBcF3U11"],
    ["an EVM address", "0xAbC0000000000000000000000000000000000001"],
    ["an empty string", ""],
  ])("GIVEN %s WHEN decoding THEN it returns null", (_label, value) => {
    expect(tryDecodeSolanaAddress(value)).toBeNull();
  });
});
