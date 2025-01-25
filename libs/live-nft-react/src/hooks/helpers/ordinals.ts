import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { OrdinalsChainsEnum } from "../types";

/**
 * Categorizes an array of NFTs into two categories: rareSats and inscriptions.
 * @param nfts - The array of NFTs to categorize.
 * @returns An object containing two arrays: rareSats and inscriptions.
 */
export function categorizeNftsByChain(nfts: SimpleHashNft[]): {
  rareSats: SimpleHashNft[];
  inscriptions: SimpleHashNft[];
} {
  const initialAccumulator = {
    rareSats: [] as SimpleHashNft[],
    inscriptions: [] as SimpleHashNft[],
  };

  return nfts.reduce((accumulator, nft) => {
    if (nft.chain === OrdinalsChainsEnum.INSCRIPTIONS) accumulator.inscriptions.push(nft);
    else accumulator.rareSats.push(nft);
    return accumulator;
  }, initialAccumulator);
}

/**
 * Processes an array of rareSats by removing the common rarity.
 * it's easily changeable to remove other rarity
 * @param rareSats - An array of rareSats to process.
 * @returns An array of rareSats with the common rarity removed.
 */
export function removeCommonRareSats(rareSats: SimpleHashNft[]): SimpleHashNft[] {
  return rareSats
    .map(nft => {
      const utxoDetails = nft.extra_metadata?.utxo_details;
      if (utxoDetails) {
        const { common, ...restSatributes } = utxoDetails.satributes;
        return {
          ...nft,
          extra_metadata: {
            ...nft.extra_metadata,
            utxo_details: {
              ...utxoDetails,
              satributes: restSatributes,
            },
          },
        };
      }
      return nft;
    })
    .filter(nft => {
      const utxoDetails = nft.extra_metadata?.utxo_details;
      if (utxoDetails) {
        const keys = Object.keys(utxoDetails.satributes);
        return keys.length > 0;
      }
      return true;
    });
}
/**
 * Processes an array of rareSats by regrouping them by Contract Address.
 * @param rareSats - An array of rareSats to process.
 * @returns An array of rareSats with the common rarity removed.
 */
export function regroupRareSatsByContractAddress(
  rareSats: SimpleHashNft[],
): Record<string, SimpleHashNft[]> {
  return rareSats.reduce<Record<string, SimpleHashNft[]>>((acc, sat) => {
    const { contract_address } = sat;
    acc[contract_address] = acc[contract_address] || [];
    acc[contract_address].push(sat);
    return acc;
  }, {});
}

/**
 * Processes the NFTs by restructuring them.
 * @param nfts - The array of NFTs to process.
 * @returns An object containing two arrays: rareSats and inscriptions.
 */
export function processOrdinals(nfts: SimpleHashNft[]): {
  rareSats: SimpleHashNft[];
  inscriptions: SimpleHashNft[];
} {
  const { rareSats, inscriptions } = categorizeNftsByChain(nfts);
  const rareSatsWithoutCommonSats = removeCommonRareSats(rareSats);

  return {
    rareSats: rareSatsWithoutCommonSats,
    inscriptions,
  };
}
