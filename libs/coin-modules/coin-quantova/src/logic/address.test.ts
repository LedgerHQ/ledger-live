import {
  encodeQAddress,
  decodeQAddress,
  decodeHexAddress,
  isValidQAddress,
} from "./address";

const body = (() => {
  const b = new Uint8Array(20);
  b[0] = 0x40; // "Q" brand byte
  for (let i = 1; i < 20; i++) b[i] = (i * 37 + 11) & 0xff;
  return b;
})();

describe("Quantova address codec", () => {
  it("encodes a 20-byte body to a canonical Q1… Bech32m address", () => {
    const addr = encodeQAddress(body);
    expect(addr.startsWith("Q1")).toBe(true);
  });

  it("round-trips Bech32m encode -> decode", () => {
    const decoded = decodeQAddress(encodeQAddress(body));
    expect(decoded).not.toBeNull();
    expect(Array.from(decoded as Uint8Array)).toEqual(Array.from(body));
  });

  it("rejects a tampered checksum", () => {
    const addr = encodeQAddress(body);
    const tampered = addr.slice(0, -1) + (addr.slice(-1) === "A" ? "C" : "A");
    expect(decodeQAddress(tampered)).toBeNull();
  });

  it("rejects a body without the 0x40 brand byte", () => {
    const bad = new Uint8Array(body);
    bad[0] = 0x41;
    expect(decodeQAddress(encodeQAddress(bad))).toBeNull();
  });

  it("decodes the hex H160 form (0x / Qx / bare Q prefixes)", () => {
    const hex = Buffer.from(body).toString("hex");
    expect(decodeHexAddress("0x" + hex)).not.toBeNull();
    expect(decodeHexAddress("Qx" + hex)).not.toBeNull();
    expect(decodeHexAddress("Q" + hex)).not.toBeNull();
  });

  it("isValidQAddress accepts both forms and rejects junk", () => {
    expect(isValidQAddress(encodeQAddress(body))).toBe(true);
    expect(isValidQAddress("0x" + Buffer.from(body).toString("hex"))).toBe(true);
    expect(isValidQAddress("not-an-address")).toBe(false);
    expect(isValidQAddress("")).toBe(false);
  });
});
