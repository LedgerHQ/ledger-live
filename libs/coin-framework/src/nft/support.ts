import type {
  NFTCollectionMetadataResponse,
  NFTMetadataResponse,
  NFTStandard,
  ProtoNFT,
} from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CollectionMetadataInput, NftMetadataInput } from "./types";
import { Batcher } from "../batcher/types";
import { makeBatcher } from "../batcher";

export function isNFTActive(currency: CryptoCurrency | undefined | null): boolean {
  return getEnv("NFT_CURRENCIES").split(",").includes(currency?.id);
}

const nftCapabilities: Record<string, NFTStandard[]> = {
  hasQuantity: ["ERC1155"],
};

type NftCapabilty = keyof typeof nftCapabilities;

export const getNftCapabilities = (
  nft: ProtoNFT | undefined | null,
): Record<NftCapabilty, boolean> =>
  (Object.entries(nftCapabilities) as [NftCapabilty, NFTStandard[]][]).reduce(
    (acc, [capability, standards]) => ({
      ...acc,
      [capability]: nft?.standard ? standards.includes(nft.standard) : false,
    }),
    {} as Record<NftCapabilty, boolean>,
  );

const batchersMap = new Map();

/**
 * In order to `instanciate`/make only 1 batcher by currency,
 * they're `cached` in a Map and retrieved by this method
 * This method is still EVM based for now but can be improved
 * to implement an even more generic solution
 */
export const metadataCallBatcher = (
  currency: CryptoCurrency,
  api: {
    getNftMetadata: (input: NftMetadataInput[], chainId: number) => Promise<NFTMetadataResponse[]>;
    getNftCollectionMetadata: (
      input: CollectionMetadataInput[],
      chainId: number,
    ) => Promise<NFTCollectionMetadataResponse[]>;
  },
): {
  loadNft: Batcher<NftMetadataInput, NFTMetadataResponse>;
  loadCollection: Batcher<CollectionMetadataInput, NFTCollectionMetadataResponse>;
} => {
  const chainId = currency?.ethereumLikeInfo?.chainId;

  if (!chainId) {
    throw new Error("Ethereum: No chainId for this Currency");
  }

  if (!batchersMap.has(currency.id)) {
    batchersMap.set(currency.id, {
      nft: makeBatcher(api.getNftMetadata, chainId),
      collection: makeBatcher(api.getNftCollectionMetadata, chainId),
    });
  }

  const batchers = batchersMap.get(currency.id);
  return {
    loadNft: batchers.nft,
    loadCollection: batchers.collection,
  };
};
