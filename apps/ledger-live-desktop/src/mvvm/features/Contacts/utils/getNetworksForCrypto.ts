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
