/** Minimal hex helpers (no dependency). */

export function bytesToHex(bytes: Uint8Array, prefix = false): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return prefix ? "0x" + s : s;
}

export function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") || hex.startsWith("0X") ? hex.slice(2) : hex;
  if (h.length % 2 !== 0) throw new Error("hex string must have an even length");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}
