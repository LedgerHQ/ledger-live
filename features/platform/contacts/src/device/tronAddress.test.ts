import { tryDecodeTronAddress } from "./tronAddress";

describe("tryDecodeTronAddress", () => {
  it("GIVEN a valid base58check address WHEN decoding THEN it returns its 21 bytes without the checksum", () => {
    // WHEN
    const result = tryDecodeTronAddress("TUjT4fqfNmuCq5wnPfgZayswhGTBcF3U11");

    // THEN
    expect(result).toHaveLength(21);
    expect(result?.[0]).toBe(0x41);
    expect(Buffer.from(result ?? []).toString("hex")).toBe(
      "41cdd04e1580f2ae3447aa7129a21aa57a92be6c14",
    );
  });

  it.each([
    ["a bad checksum", "TUjT4fqfNmuCq5wnPfgZayswhGTBcF3U12"],
    ["a non-base58 character", "TUjT4fqfNmuCq5wnPfgZayswhGTBcF3U10"],
    ["a truncated address", "TUjT4fqfNmuCq5wnPfgZayswhGTBcF3U1"],
    // Valid base58check, but a Bitcoin payload (version 0x00), not Tron's 0x41.
    ["a non-Tron base58check address", "1BoatSLRHtKNngkdXEeobR76b53LETtpyT"],
    ["an empty string", ""],
  ])("GIVEN %s WHEN decoding THEN it returns null", (_label, value) => {
    expect(tryDecodeTronAddress(value)).toBeNull();
  });
});
