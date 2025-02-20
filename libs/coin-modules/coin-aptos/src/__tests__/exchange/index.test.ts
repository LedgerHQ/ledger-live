import { pathToBuffer } from "../../exchange";

describe("pathToBuffer", () => {
  it("should convert a derivation path to Buffer", () => {
    const str = "44'/637'/0'/0/0";
    const expectedResult = Buffer.from([
      0x05, 0x80, 0x00, 0x00, 0x2c, 0x80, 0x00, 0x02, 0x7d, 0x80, 0x00, 0x00, 0x00, 0x80, 0x00,
      0x00, 0x00, 0x80, 0x00, 0x00, 0x00,
    ]);
    expect(pathToBuffer(str)).toEqual(expectedResult);
  });
});
