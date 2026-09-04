export const bip32PathToBytes = (path: string): Buffer => {
  const parts = path.split("/");
  return Buffer.concat(
    parts.map(part => {
      // Fail closed: reject empty/non-numeric/truncated segments (e.g. "NOTAINDEX", "12abc'").
      // NaN previously collapsed to hardened 0 via Math.abs(NaN)|0x80000000.
      if (!/^\d+'?$/.test(part)) {
        throw new Error(`Invalid BIP32 path segment: ${part}`);
      }
      if (parseInt(part, 10) > 0x7fffffff) {
        throw new Error(`Invalid BIP32 path segment: ${part}`);
      }
      const i32 = part.endsWith("'")
        ? parseInt(part.slice(0, -1), 10) | 0x80000000
        : parseInt(part, 10);
      return Buffer.from([(i32 >> 24) & 0xff, (i32 >> 16) & 0xff, (i32 >> 8) & 0xff, i32 & 0xff]);
    }),
  );
};
