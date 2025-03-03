import { pathElementsToBuffer, bip32asBuffer } from "../src/bip32";

describe("Aptos bip32asBuffer", () => {
  test("pathElementsToBuffer", () => {
    const arg = [44, 637, 1, 0, 0];
    const expected = Buffer.from([
      0x05, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x02, 0x7d, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    expect(pathElementsToBuffer(arg)).toStrictEqual(expected);
  });

  test("bip32asBuffer", () => {
    const arg = "44'/637'/1'/0'/0'";
    const expected = Buffer.from([
      0x05, 0x80, 0x00, 0x00, 0x2c, 0x80, 0x00, 0x02, 0x7d, 0x80, 0x00, 0x00, 0x01, 0x80, 0x00,
      0x00, 0x00, 0x80, 0x00, 0x00, 0x00,
    ]);
    expect(bip32asBuffer(arg)).toStrictEqual(expected);
  });

  test("bip32asBuffer with empty string", () => {
    const arg = "";
    const expected = Buffer.from([0x00]);
    expect(bip32asBuffer(arg)).toStrictEqual(expected);
  });
});
