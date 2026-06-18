export function excludeFromTlv(tlv: Buffer, toExclude: number[]): Buffer {
  const excludeSet = new Set(toExclude);
  const fields: Buffer[] = [];
  for (let start = 0; start < tlv.length; ) {
    const length = tlv[start + 1];
    const end = start + 2 + length;
    if (isNaN(length) || end > tlv.length) {
      throw new RangeError("Malformed TLV: declared length exceeds buffer");
    }
    const tag = tlv[start];
    if (!excludeSet.has(tag)) {
      fields.push(tlv.subarray(start, end));
    }
    start = end; // move to the next TLV entry
  }
  return Buffer.concat(fields);
}

export function toTlvField(tag: number, value: Uint8Array): Buffer {
  return Buffer.from([tag, value.length, ...value]);
}
