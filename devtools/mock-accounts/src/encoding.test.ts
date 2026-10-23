import { base58check, checksumAddress } from "./encoding";

describe("encoding", () => {
  it("writes base58check with leading zeros as 1", () => {
    expect(base58check(new Uint8Array(21))).toBe("1111111111111111111114oLvT2");
  });

  it("writes the EIP-55 checksum casing", () => {
    const bytes = Uint8Array.from(
      "5aaeb6053f3e94c9b9a09f33669435e7ef1beaed".match(/../g) ?? [],
      byte => Number.parseInt(byte, 16),
    );
    expect(checksumAddress(bytes)).toBe("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed");
  });
});
