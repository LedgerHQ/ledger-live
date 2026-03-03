import { decodeApduResponseHex, decodeHex, encodeApdu } from "./apdu";

describe("apdu helpers", () => {
  it("encodes APDU bytes to hex", () => {
    const apdu = new Uint8Array([0xe0, 0x01, 0x00, 0x00]);

    expect(encodeApdu(apdu)).toBe("e0010000");
  });

  it("decodes hex to bytes", () => {
    expect(decodeHex("aa9000")).toEqual(new Uint8Array([0xaa, 0x90, 0x00]));
    expect(decodeHex("")).toEqual(new Uint8Array([]));
  });

  it("splits APDU response bytes into data and status code", () => {
    const response = decodeApduResponseHex("aa9000");

    expect(response.data).toEqual(new Uint8Array([0xaa]));
    expect(response.statusCode).toEqual(new Uint8Array([0x90, 0x00]));
  });

  it("throws when APDU response is shorter than 2 bytes", () => {
    expect(() => decodeApduResponseHex("90")).toThrow("APDU response too short");
  });
});
