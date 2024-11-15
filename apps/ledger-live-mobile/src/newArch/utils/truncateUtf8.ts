export function truncateUtf8(str: string, maxBytes: number) {
  const totalBytesLength = Buffer.from(str).byteLength;
  if (totalBytesLength <= maxBytes) return str;
  if (totalBytesLength === str.length) return str.slice(0, maxBytes);

  // NOTE in js strings characters above U+FFFF (i.e outside the Basic Multilingual Plane) are represented by two UTF-16 code units
  // the spread operator will split these strings correctly with some "characters" being strings of length 2.
  let byteLen = 0;
  let charLen = 0;
  for (const char of [...str]) {
    byteLen += Buffer.from(char).byteLength;
    if (byteLen > maxBytes) return str.slice(0, charLen);
    charLen += char.length;
  }
  return str;
}
