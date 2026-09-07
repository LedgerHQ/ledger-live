export const toHex = (arr: Uint8Array): string =>
  Array.from(arr)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

export const fromHex = (hex: string): Uint8Array => {
  const clean = hex.replace(/\s/g, "");
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error("Invalid hex string");
  }
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) bytes.push(Number.parseInt(clean.slice(i, i + 2), 16));
  return new Uint8Array(bytes);
};
