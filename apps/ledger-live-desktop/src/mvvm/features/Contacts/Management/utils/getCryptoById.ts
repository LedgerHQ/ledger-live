import {
  TOP_CRYPTOS,
  type CryptoOption,
} from "~/mvvm/features/Contacts/constants/topCryptos";

/**
 * Lookup a CryptoOption by its stable id. Returns `undefined` when
 * the id isn't in the top-50 list (e.g. older sidecar metadata
 * referencing a pruned entry).
 */
export function getCryptoById(id: string): CryptoOption | undefined {
  return TOP_CRYPTOS.find(c => c.id === id);
}

/**
 * The "native gas token" for a given chainId — used as the fallback
 * crypto when an address has no sidecar metadata (e.g. contacts
 * registered before the crypto picker was added). Maps chainId →
 * crypto id from the `topCryptos` list.
 *
 * Lossy by design — there's no single right answer for "what crypto
 * is at this raw address". We pick the chain's own gas token because
 * that's the safest default visual (ETH for Ethereum, POL for
 * Polygon, etc.).
 */
// Keep these ids in sync with the CoinGecko slugs used in
// `constants/topCryptos.ts` — that's what `getCryptoById` looks up.
const CHAIN_NATIVE_CRYPTO_ID: Record<number, string> = {
  1: "ethereum",
  10: "ethereum", // Optimism gas token = ETH
  56: "binancecoin",
  137: "matic-network",
  8453: "ethereum", // Base gas token = ETH
  42161: "ethereum", // Arbitrum gas token = ETH
  43114: "avalanche-2",
  59144: "ethereum", // Linea gas token = ETH
  25: "crypto-com-chain",
  250: "fantom",
};

export function getNativeCryptoIdForChain(chainId: number): string | undefined {
  return CHAIN_NATIVE_CRYPTO_ID[chainId];
}
