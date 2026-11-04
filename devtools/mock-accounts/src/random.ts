/** Draws in [0, 1), the same sequence for the same seed. */
export type Random = () => number;

/** FNV-1a of the seed's code points, then mulberry32. */
export function seededRandom(seed: string): Random {
  let state = 0x811c9dc5;
  for (const char of seed) {
    state = Math.imul(state ^ (char.codePointAt(0) ?? 0), 0x01000193) >>> 0;
  }
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

export function randomBytes(random: Random, length: number): Uint8Array {
  return Uint8Array.from({ length }, () => Math.floor(random() * 256));
}

/** An amount in the smallest unit, log-uniform between `min` and `max` coins: small balances are as common as large ones. */
export function randomAmount(random: Random, magnitude: number, min: number, max: number): bigint {
  const coins = Math.exp(Math.log(min) + random() * (Math.log(max) - Math.log(min)));
  const digits = Math.min(magnitude, 6);
  return BigInt(Math.round(coins * 10 ** digits)) * 10n ** BigInt(magnitude - digits);
}
