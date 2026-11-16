const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values: readonly number[]): number {
  let check = 1;
  for (const value of values) {
    const top = check >>> 25;
    check = ((check & 0x1ffffff) << 5) ^ value;
    GENERATOR.forEach((generator, bit) => {
      if ((top >>> bit) & 1) check ^= generator;
    });
  }
  return check;
}

function toWords(bytes: Uint8Array): number[] {
  const words: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      words.push((buffer >>> bits) & 31);
    }
    buffer &= (1 << bits) - 1;
  }
  if (bits > 0) words.push((buffer << (5 - bits)) & 31);
  return words;
}

/** BIP-173 bech32, without its 90 character limit, which Cardano keys exceed. */
export function bech32(prefix: string, bytes: Uint8Array): string {
  const codes = [...prefix].map(char => char.codePointAt(0) ?? 0);
  const words = toWords(bytes);
  const expanded = [...codes.map(code => code >> 5), 0, ...codes.map(code => code & 31)];
  const mod = polymod([...expanded, ...words, 0, 0, 0, 0, 0, 0]) ^ 1;
  const checksum = Array.from({ length: 6 }, (_, index) => (mod >>> (5 * (5 - index))) & 31);
  return `${prefix}1${[...words, ...checksum].map(word => CHARSET[word]).join("")}`;
}
