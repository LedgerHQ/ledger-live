export const MAX_UTXOS_PER_TX: number = 88;
export const DEFAULT_MASS_1_OUTPUT: number = 506;

export const MASS_PER_INPUT: number = 1118; // Per selected utxo as input, mass increases by this value.
export const MASS_PER_OUTPUT: number = 412; // Per selected utxo as input, mass increases by this value.

export const MASS_LIMIT_PER_TX = 100_000; // TX mass must not exceed 100k gram.
export const MAX_DISCARD: number = 2000_0000; // Throw error, if discarded value is higher than this.
