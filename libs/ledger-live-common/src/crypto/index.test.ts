import { bip32asBuffer } from ".";

describe("bip32asBuffer", () => {
  it("converts TON path", () => {
    let path = bip32asBuffer("m/44'/1/1/0");
    expect(path).toEqual(Buffer.from("048000002c000000010000000100000000", "hex"));

    path = bip32asBuffer("m/44'/1'/1/0");
    expect(path).toEqual(Buffer.from("048000002c800000010000000100000000", "hex"));

    path = bip32asBuffer("m/44'/1'/1'/0");
    expect(path).toEqual(Buffer.from("048000002c800000018000000100000000", "hex"));
  });
});
