import { NETWORKS, type NetworkOption } from "../constants/networks";
import { TOP_CRYPTOS } from "../constants/topCryptos";

/**
 * Look up the networks a given crypto lives on.
 *
 * Reads `CryptoOption.networkIds` for the matching entry, maps each
 * id through the central `NETWORKS` registry, and silently drops any
 * id that doesn't resolve (defensive — keeps the dropdown sane even
 * when the two static lists drift).
 *
 * Pure / sync — see `constants/networks.ts` for the hardcoded-data
 * trade-off note and the eventual CAL-feed migration path.
 */
/**
 * True if the crypto has at least one EVM-compatible network — i.e.
 * a network registry entry whose `chainId` is set. Used by the L4
 * Add-Address picker to disable cryptos that the DMK contact verbs
 * can't yet handle (Bitcoin, Solana, XRP, etc.).
 */
export function isCryptoEvmCompatible(cryptoId: string): boolean {
  return getNetworksForCrypto(cryptoId).some(n => typeof n.chainId === "number");
}

export function getNetworksForCrypto(cryptoId: string): NetworkOption[] {
  const crypto = TOP_CRYPTOS.find(c => c.id === cryptoId);
  if (!crypto) return [];
  const out: NetworkOption[] = [];
  for (const id of crypto.networkIds) {
    const network = NETWORKS[id];
    if (network) out.push(network);
  }
  return out;
}
