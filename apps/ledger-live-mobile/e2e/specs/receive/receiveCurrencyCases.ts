import type { ReceiveCurrencyScanningCase } from "./receiveCurrencyScanningFlow";

/** UTXO + EVM-style chains — subset A (split for parallel Detox workers). */
export const receiveCurrencyCasesUtxoEvmA: ReceiveCurrencyScanningCase[] = [
  ["bitcoin"],
  ["ethereum", "ethereum"],
  ["bsc"],
];

/** UTXO + EVM-style chains — subset B. */
export const receiveCurrencyCasesUtxoEvmB: ReceiveCurrencyScanningCase[] = [
  ["dogecoin"],
  ["avalanche_c_chain"],
  ["polygon", "polygon"],
];

/** Full UTXO + EVM matrix (A then B). */
export const receiveCurrencyCasesUtxoEvm: ReceiveCurrencyScanningCase[] = [
  ...receiveCurrencyCasesUtxoEvmA,
  ...receiveCurrencyCasesUtxoEvmB,
];

/** XRP + Cardano (split for parallel Detox workers). */
export const receiveCurrencyCasesOtherA: ReceiveCurrencyScanningCase[] = [
  ["ripple"],
  ["cardano"],
];

/** Polkadot + Cosmos. */
export const receiveCurrencyCasesOtherB: ReceiveCurrencyScanningCase[] = [
  ["polkadot", "assethub_polkadot"],
  ["cosmos", "cosmos"],
];

/** Remaining receive scanning cases from the former monolithic suite. */
export const receiveCurrencyCasesOther: ReceiveCurrencyScanningCase[] = [
  ...receiveCurrencyCasesOtherA,
  ...receiveCurrencyCasesOtherB,
];
