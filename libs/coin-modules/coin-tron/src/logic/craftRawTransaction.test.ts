import { craftRawTransaction } from "./craftRawTransaction";

describe("craftRawTransaction", () => {
  it("returns the raw_data_hex verbatim as the transaction to sign", () => {
    const rawDataHex = "0a02abcd220812345678";
    expect(craftRawTransaction(rawDataHex)).toEqual({ transaction: rawDataHex });
  });

  it.each([
    ["", "empty"],
    ["0xdeadbeef", "0x-prefixed"],
    ["zzzz", "non-hex"],
    ["abc", "odd-length"],
  ])("throws on a %s (%s) input rather than signing arbitrary bytes", input => {
    expect(() => craftRawTransaction(input)).toThrow(/raw_data_hex/);
  });
});
