import type {
  NFTCollectionMetadataResponse,
  NFTMetadataResponse,
  NFTStandard,
  ProtoNFT,
} from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CollectionMetadataInput, NftMetadataInput, NftRequestsBatcher } from "./types";
import { makeBatcher } from "@ledgerhq/live-network/batcher";

export function isNFTActive(currency: CryptoCurrency | undefined | null): boolean {
  return !!currency && getEnv("NFT_CURRENCIES").includes(currency?.id);
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

const batchersMap = new Map<string, NftRequestsBatcher>();

/**
 * In order to `instanciate`/make only 1 batcher by currency,
 * they're `cached` in a Map and retrieved by this method
 * This method is still EVM based for now but can be improved
 * to implement an even more generic solution
 */
export const metadataCallBatcher = <Params>(
  currency: CryptoCurrency,
  api: {
    getNftMetadata: (input: NftMetadataInput[], params: Params) => Promise<NFTMetadataResponse[]>;
    getNftCollectionMetadata: (
      input: CollectionMetadataInput[],
      params: Params,
    ) => Promise<NFTCollectionMetadataResponse[]>;
    getParams: (currency: CryptoCurrency) => Params;
  },
): NftRequestsBatcher => {
  if (!batchersMap.has(currency.id)) {
    const params = api.getParams(currency);

    const batcher = {
      loadNft: makeBatcher(api.getNftMetadata, params),
      loadCollection: makeBatcher(api.getNftCollectionMetadata, params),
    };
    batchersMap.set(currency.id, batcher);
  }

  return batchersMap.get(currency.id)!;
};
