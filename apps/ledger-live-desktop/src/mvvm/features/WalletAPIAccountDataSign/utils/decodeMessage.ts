const isPrintable = (char: string) => {
  const code = char.codePointAt(0) ?? 0;
  if (char === "\n" || char === "\r" || char === "\t") return true;
  return code >= 0x20 && !(code >= 0x7f && code <= 0x9f) && code !== 0xfffd;
};

/** The message as UTF-8 text when it all prints, otherwise its hex. */
export function decodeMessage(messageHex: string): string {
  const hex = messageHex.startsWith("0x") ? messageHex.slice(2) : messageHex;
  const text = Buffer.from(hex, "hex").toString("utf8");
  if (hex.length > 0 && Array.from(text).every(isPrintable)) return text;
  return `0x${hex}`;
}
