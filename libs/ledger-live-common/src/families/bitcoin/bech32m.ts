// Ported from https://github.com/bitcoinjs/bech32/tree/605655d6b37a782345549cd1388db688a96ad56f
// until we can use bech32 2.0.0
// We can't directly use bech32 2.0.0 because many of our dependencies are still using bech32 ^1.1.3
// which conflict on mobile (root cause of https://ledgerhq.atlassian.net/browse/LL-7930)
// FIXME Remove that file and use bech32 2.0.0 when all dependencies also uses it.

const ENCODING_CONST = 0x2bc830a3;
const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const ALPHABET_MAP: { [key: string]: number } = {};
for (let z = 0; z < ALPHABET.length; z++) {
  const x = ALPHABET.charAt(z);
  ALPHABET_MAP[x] = z;
}

function prefixChk(prefix) {
  let chk = 1;
  for (let i = 0; i < prefix.length; ++i) {
    const c = prefix.charCodeAt(i);
    if (c < 33 || c > 126) return "Invalid prefix (" + prefix + ")";
    chk = polymodStep(chk) ^ (c >> 5);
  }
  chk = polymodStep(chk);
  for (let i = 0; i < prefix.length; ++i) {
    const v = prefix.charCodeAt(i);
    chk = polymodStep(chk) ^ (v & 0x1f);
  }
  return chk;
}

function polymodStep(pre: number): number {
  const b = pre >> 25;
  return (
    ((pre & 0x1ffffff) << 5) ^
    (-((b >> 0) & 1) & 0x3b6a57b2) ^
    (-((b >> 1) & 1) & 0x26508e6d) ^
    (-((b >> 2) & 1) & 0x1ea119fa) ^
    (-((b >> 3) & 1) & 0x3d4233dd) ^
    (-((b >> 4) & 1) & 0x2a1462b3)
  );
}

function encode(
  prefix: string,
  words: ArrayLike<number>,
  LIMIT?: number
): string {
  LIMIT = LIMIT || 90;
  if (prefix.length + 7 + words.length > LIMIT)
    throw new TypeError("Exceeds length limit");

  prefix = prefix.toLowerCase();

  // determine chk mod
  let chk = prefixChk(prefix);
  if (typeof chk === "string") throw new Error(chk);

  let result = prefix + "1";
  for (let i = 0; i < words.length; ++i) {
    const x = words[i];
    if (x >> 5 !== 0) throw new Error("Non 5-bit word");

    chk = polymodStep(chk) ^ x;
    result += ALPHABET.charAt(x);
  }

  for (let i = 0; i < 6; ++i) {
    chk = polymodStep(chk);
  }
  chk ^= ENCODING_CONST;

  for (let i = 0; i < 6; ++i) {
    const v = (chk >> ((5 - i) * 5)) & 0x1f;
    result += ALPHABET.charAt(v);
  }

  return result;
}

function __decode(str: string, LIMIT?: number) {
  LIMIT = LIMIT || 90;
  if (str.length < 8) return str + " too short";
  if (str.length > LIMIT) return "Exceeds length limit";

  // don't allow mixed case
  const lowered = str.toLowerCase();
  const uppered = str.toUpperCase();
  if (str !== lowered && str !== uppered) return "Mixed-case string " + str;
  str = lowered;

  const split = str.lastIndexOf("1");
  if (split === -1) return "No separator character for " + str;
  if (split === 0) return "Missing prefix for " + str;

  const prefix = str.slice(0, split);
  const wordChars = str.slice(split + 1);
  if (wordChars.length < 6) return "Data too short";

  let chk = prefixChk(prefix);
  if (typeof chk === "string") return chk;

  const words: number[] = [];
  for (let i = 0; i < wordChars.length; ++i) {
    const c = wordChars.charAt(i);
    const v = ALPHABET_MAP[c];
    if (v === undefined) return "Unknown character " + c;
    chk = polymodStep(chk) ^ v;

    // not in the checksum?
    if (i + 6 >= wordChars.length) continue;
    words.push(v);
  }

  if (chk !== ENCODING_CONST) return "Invalid checksum for " + str;
  return { prefix, words };
}

function decodeUnsafe(str: string, LIMIT?: number) {
  const res = __decode(str, LIMIT);
  if (typeof res === "object") return res;
}

function decode(str: string, LIMIT?: number) {
  const res = __decode(str, LIMIT);
  if (typeof res === "object") return res;

  throw new Error(res);
}

function convert(
  data: ArrayLike<number>,
  inBits: number,
  outBits: number,
  pad: true
): number[];
function convert(
  data: ArrayLike<number>,
  inBits: number,
  outBits: number,
  pad: false
): number[] | string;
function convert(
  data: ArrayLike<number>,
  inBits: number,
  outBits: number,
  pad: boolean
): number[] | string {
  let value = 0;
  let bits = 0;
  const maxV = (1 << outBits) - 1;

  const result: number[] = [];
  for (let i = 0; i < data.length; ++i) {
    value = (value << inBits) | data[i];
    bits += inBits;

    while (bits >= outBits) {
      bits -= outBits;
      result.push((value >> bits) & maxV);
    }
  }

  if (pad) {
    if (bits > 0) {
      result.push((value << (outBits - bits)) & maxV);
    }
  } else {
    if (bits >= inBits) return "Excess padding";
    if ((value << (outBits - bits)) & maxV) return "Non-zero padding";
  }

  return result;
}

function toWords(bytes: ArrayLike<number>): number[] {
  return convert(bytes, 8, 5, true);
}

function fromWordsUnsafe(words: ArrayLike<number>): number[] | undefined {
  const res = convert(words, 5, 8, false);
  if (Array.isArray(res)) return res;
}

function fromWords(words: ArrayLike<number>): number[] {
  const res = convert(words, 5, 8, false);
  if (Array.isArray(res)) return res;

  throw new Error(res);
}

export const bech32m = {
  decodeUnsafe,
  decode,
  encode,
  toWords,
  fromWordsUnsafe,
  fromWords,
};
