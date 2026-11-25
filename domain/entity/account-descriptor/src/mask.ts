const HEAD = 6;
const TAIL = 4;

/** The one display form of an account key or address: `xpub6B…WNzh`; a short key keeps only its head. */
export function maskAccountKey(key: string): string {
  if (key.length <= HEAD + TAIL) return `${key.slice(0, 2)}…`;
  return `${key.slice(0, HEAD)}…${key.slice(-TAIL)}`;
}
