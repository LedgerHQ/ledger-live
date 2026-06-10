import bs58check from "bs58check";
import { validateAddress } from "./validateAddress";

describe("validateAddress", () => {
  it("returns true for a valid mainnet address (incident address)", async () => {
    expect(await validateAddress("TNYJQhvXQAfeFFXH5G6cV5uXrx168fnFGE", {})).toBe(true);
  });

  it("returns true for another valid mainnet address", async () => {
    expect(await validateAddress("TGj1Ej1qRzL9feLTLhjwgxXF4Ct6GTWg2U", {})).toBe(true);
  });

  it("returns true for a valid Shasta testnet address", async () => {
    expect(await validateAddress("TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1", {})).toBe(true);
  });

  it("returns false for an empty string", async () => {
    expect(await validateAddress("", {})).toBe(false);
  });

  it("returns false for a clearly invalid string", async () => {
    expect(await validateAddress("notanaddress", {})).toBe(false);
  });

  it("returns false for a Bitcoin address (wrong version byte)", async () => {
    expect(await validateAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7Divfna", {})).toBe(false);
  });

  it("returns false for a too-short Base58Check string", async () => {
    expect(await validateAddress("TQ7pF3NTDL", {})).toBe(false);
  });

  it("returns false for a too-long Base58Check string", async () => {
    expect(await validateAddress("TNYJQhvXQAfeFFXH5G6cV5uXrx168fnFGE1", {})).toBe(false);
  });

  it("returns false for an invalid Base58Check checksum", async () => {
    expect(await validateAddress("T1YJQhvXQAfeFFXH5G6cV5uXrx168fnFGE", {})).toBe(false);
  });

  it("returns false when decoded payload has the wrong prefix byte", async () => {
    expect(await validateAddress("TubpyjkKGq7gR3PBSD6qZpBg2tYk7MJR41", {})).toBe(false);
  });

  it("returns false when decoded payload has an unexpected length", async () => {
    const decodeSpy = jest.spyOn(bs58check, "decode").mockReturnValue(Buffer.alloc(20, 0x41));

    expect(await validateAddress("TNYJQhvXQAfeFFXH5G6cV5uXrx168fnFGE", {})).toBe(false);

    decodeSpy.mockRestore();
  });
});
