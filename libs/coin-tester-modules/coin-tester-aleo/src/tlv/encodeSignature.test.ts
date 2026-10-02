import { encodeSignatureTlv } from "./encodeSignature";
import { readTlv, STRUCTURE_TYPE, TLV_TAG, TLV_VERSION_V1 } from "./tags";

function filled(length: number, byte: number): Uint8Array {
  return new Uint8Array(length).fill(byte);
}

function tagsOf(hex: string): { tag: number; value: Uint8Array }[] {
  const bytes = new Uint8Array(Buffer.from(hex, "hex"));
  const out: { tag: number; value: Uint8Array }[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    const { tag, value, next } = readTlv(bytes, offset);
    out.push({ tag, value });
    offset = next;
  }
  return out;
}

describe("encodeSignatureTlv", () => {
  const parts = {
    signature: filled(128, 0xaa),
    tvk: filled(32, 0xbb),
    tpk: filled(32, 0xcc),
    gammas: [],
  };

  it("opens with the signature structure type and version", () => {
    const hex = encodeSignatureTlv(parts);
    expect(hex.startsWith("01012a020101")).toBe(true);
    const [structure, version] = tagsOf(hex);
    expect(structure.tag).toBe(TLV_TAG.StructureType);
    expect([...structure.value]).toStrictEqual([STRUCTURE_TYPE.Signature]);
    expect(version.tag).toBe(TLV_TAG.Version);
    expect([...version.value]).toStrictEqual([TLV_VERSION_V1]);
  });

  it("emits signature, tvk, tpk and a zero gamma count", () => {
    const decoded = tagsOf(encodeSignatureTlv(parts));
    const byTag = new Map(decoded.map(entry => [entry.tag, entry.value]));

    expect(byTag.get(TLV_TAG.Signature)?.length).toBe(128);
    expect(byTag.get(TLV_TAG.Tvk)?.length).toBe(32);
    expect(byTag.get(TLV_TAG.Tpk)?.length).toBe(32);
    expect([...(byTag.get(TLV_TAG.GammasCount) ?? [])]).toStrictEqual([0]);
    expect(byTag.has(TLV_TAG.Gammas)).toBe(false);
  });

  it("encodes the 128-byte signature length as a low-prefixed varint", () => {
    // Tag 0x15, length 128 -> 0x81 0x80. Anything shorter would misparse.
    expect(encodeSignatureTlv(parts)).toContain("158180");
  });

  it("emits gammas concatenated, with a matching count", () => {
    const decoded = tagsOf(
      encodeSignatureTlv({ ...parts, gammas: [filled(32, 0x01), filled(32, 0x02)] }),
    );
    const byTag = new Map(decoded.map(entry => [entry.tag, entry.value]));

    expect([...(byTag.get(TLV_TAG.GammasCount) ?? [])]).toStrictEqual([2]);
    expect(byTag.get(TLV_TAG.Gammas)?.length).toBe(64);
  });

  it("rejects parts the backend would reject", () => {
    expect(() => encodeSignatureTlv({ ...parts, signature: filled(127, 0) })).toThrow(/128/);
    expect(() => encodeSignatureTlv({ ...parts, tvk: filled(31, 0) })).toThrow(/tvk/i);
    expect(() => encodeSignatureTlv({ ...parts, tpk: filled(33, 0) })).toThrow(/tpk/i);
    expect(() => encodeSignatureTlv({ ...parts, gammas: [filled(31, 0)] })).toThrow(/gamma/i);
  });
});
