export type ZcashNetwork = "mainnet" | "testnet";

/**
 * The Zcash network a currency's addresses belong to. `zcash_regtest` keeps the
 * mainnet encodings by design (see its currency definition).
 */
export function zcashNetworkOf(currencyId: string): ZcashNetwork {
  return currencyId === "zcash_testnet" ? "testnet" : "mainnet";
}
