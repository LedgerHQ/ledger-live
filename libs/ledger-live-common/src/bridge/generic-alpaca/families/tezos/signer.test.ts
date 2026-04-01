import { convertSecp256k1DERToRaw, normalizeTo32Bytes } from "./signer";

// DER encoding helpers
function buildDer(r: Buffer, s: Buffer): string {
  const rEncoded = r[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), r]) : r;
  const sEncoded = s[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), s]) : s;
  const inner = Buffer.concat([
    Buffer.from([0x02, rEncoded.length]),
    rEncoded,
    Buffer.from([0x02, sEncoded.length]),
    sEncoded,
  ]);
  return Buffer.concat([Buffer.from([0x30, inner.length]), inner]).toString("hex");
}

describe("normalizeTo32Bytes", () => {
  it("should strip the leading 0x00 from a 33-byte buffer", () => {
    const payload = Buffer.alloc(31, 0xab);
    const input = Buffer.concat([Buffer.from([0x00]), payload]);
    expect(input.length).toBe(32);
    // 33-byte with 0x00 prefix
    const with0x00 = Buffer.concat([Buffer.from([0x00]), payload]);
    const padded33 = Buffer.concat([Buffer.from([0x00]), Buffer.alloc(32, 0xab)]);
    const result = normalizeTo32Bytes(padded33);
    expect(result.length).toBe(32);
    expect(result[0]).toBe(0xab);
  });

  it("should left-pad a short buffer to 32 bytes", () => {
    const short = Buffer.from([0x01, 0x02, 0x03]);
    const result = normalizeTo32Bytes(short);
    expect(result.length).toBe(32);
    expect(result[29]).toBe(0x01);
    expect(result[30]).toBe(0x02);
    expect(result[31]).toBe(0x03);
    expect(result[0]).toBe(0x00);
  });

  it("should return a 32-byte buffer unchanged", () => {
    const exact = Buffer.alloc(32, 0xff);
    const result = normalizeTo32Bytes(exact);
    expect(result.length).toBe(32);
    expect(result).toEqual(exact);
  });
});

describe("convertSecp256k1DERToRaw", () => {
  const r32 = Buffer.alloc(32, 0xaa);
  const s32 = Buffer.alloc(32, 0xbb);

  it("should pass through a hex string that is already 64 bytes (128 hex chars)", () => {
    const raw64 = Buffer.alloc(64, 0xcc).toString("hex");
    expect(convertSecp256k1DERToRaw(raw64)).toBe(raw64);
  });

  it("should decode a standard DER signature with 32-byte r and s", () => {
    const der = buildDer(r32, s32);
    const result = convertSecp256k1DERToRaw(der);
    expect(result).toBe(r32.toString("hex") + s32.toString("hex"));
    expect(result.length).toBe(128);
  });

  it("should strip the DER leading 0x00 from r when r is 33 bytes", () => {
    // r has high bit set → DER encoding prepends 0x00
    const rHigh = Buffer.alloc(32, 0xfe); // 0xfe has high bit set
    const der = buildDer(rHigh, s32);
    const result = convertSecp256k1DERToRaw(der);
    expect(result).toBe(rHigh.toString("hex") + s32.toString("hex"));
    expect(result.length).toBe(128);
  });

  it("should strip the DER leading 0x00 from s when s is 33 bytes", () => {
    const sHigh = Buffer.alloc(32, 0xfe);
    const der = buildDer(r32, sHigh);
    const result = convertSecp256k1DERToRaw(der);
    expect(result).toBe(r32.toString("hex") + sHigh.toString("hex"));
    expect(result.length).toBe(128);
  });

  it("should left-pad r to 32 bytes when r is shorter than 32 bytes", () => {
    const rShort = Buffer.from([0x01, 0x02]); // only 2 bytes
    const der = buildDer(rShort, s32);
    const result = convertSecp256k1DERToRaw(der);
    const expectedR = Buffer.alloc(32, 0);
    rShort.copy(expectedR, 30);
    expect(result).toBe(expectedR.toString("hex") + s32.toString("hex"));
    expect(result.length).toBe(128);
  });

  it("should left-pad s to 32 bytes when s is shorter than 32 bytes", () => {
    const sShort = Buffer.from([0x03]);
    const der = buildDer(r32, sShort);
    const result = convertSecp256k1DERToRaw(der);
    const expectedS = Buffer.alloc(32, 0);
    sShort.copy(expectedS, 31);
    expect(result).toBe(r32.toString("hex") + expectedS.toString("hex"));
    expect(result.length).toBe(128);
  });
});
