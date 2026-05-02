export const STAKING_GAS_BASE = "25000000000000";
export const FIGMENT_SUI_VALIDATOR_ADDRESS =
  "0x3d9fb148e35ef4d74fcfc36995da14fc504b885d5f2bfeca37d6ea2cc044a32d";
export const ONE_SUI = 1000000000;

/** SUI → mist string. `mist(1.5)` → `"1500000000"`. `Math.round` absorbs FP epsilon. */
export const mist = (n: number): string => String(Math.round(n * ONE_SUI));

/** SUI has no block-height metainfo; this synthetic value drives icon-status code in apps. */
export const BLOCK_HEIGHT = 5;
