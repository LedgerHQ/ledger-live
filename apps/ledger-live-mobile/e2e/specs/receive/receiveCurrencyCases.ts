import type { ReceiveCurrencyScanningCase } from "./receiveCurrencyScanningFlow";

/** UTXO + EVM-style chains (split for parallel Detox workers). */
export const receiveCurrencyCasesUtxoEvm: ReceiveCurrencyScanningCase[] = [
  ["bitcoin"],
  ["ethereum", "ethereum"],
  ["bsc"],
  ["dogecoin"],
  ["avalanche_c_chain"],
  ["polygon", "polygon"],
];

/** Remaining receive scanning cases from the former monolithic suite. */
export const receiveCurrencyCasesOther: ReceiveCurrencyScanningCase[] = [
  ["ripple"],
  ["cardano"],
  ["polkadot", "assethub_polkadot"],
  ["cosmos", "cosmos"],
];
