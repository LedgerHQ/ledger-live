import { addressesMatch } from "../addressesMatch";

describe("addressesMatch", () => {
  it("matches EVM addresses case-insensitively", () => {
    const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

    expect(addressesMatch(address, address.toLowerCase())).toBe(true);
  });

  it("matches non-EVM addresses case-sensitively", () => {
    expect(
      addressesMatch("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "1a1zp1ep5qgefi2dmptftl5slmv7divfna"),
    ).toBe(false);
    expect(
      addressesMatch("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"),
    ).toBe(true);
  });
});
