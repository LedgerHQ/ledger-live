import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { NFTCollectionMetadataResponse, NFTMetadataResponse } from "@ledgerhq/types-live";
import { CollectionMetadataInput, NftMetadataInput } from "@ledgerhq/coin-framework/nft/types";

/**
 * Batched request of nft metadata on the "ethereum" protocol
 *
 * ⚠️ ethereum protocol doesn't mean ethereum chain, you can see this
 * as the evm protocol instead, and you can specify a chainId
 * to request the metadata on any evm chain supported
 */
export const getNftMetadata = async (
  input: NftMetadataInput[],
  params: { chainId: number },
): Promise<NFTMetadataResponse[]> => {
  const { data }: { data: NFTMetadataResponse[] } = await network({
    method: "POST",
    url: `${getEnv("NFT_ETH_METADATA_SERVICE")}/v1/ethereum/${
      params.chainId
    }/contracts/tokens/infos`,
    data: input,
  });

  return data;
};

/**
 * Batched request of nft collection metadata on the "ethereum" protocol
 *
 * ⚠️ ethereum protocol doesn't mean ethereum chain, you can see this
 * as the evm protocol instead, and you can specify a chainId
 * to request the metadata on any evm chain supported
 */
export const getNftCollectionMetadata = async (
  input: CollectionMetadataInput[],
  params: { chainId: number },
): Promise<NFTCollectionMetadataResponse[]> => {
  const { data }: { data: NFTCollectionMetadataResponse[] } = await network({
    method: "POST",
    url: `${getEnv("NFT_ETH_METADATA_SERVICE")}/v1/ethereum/${params.chainId}/contracts/infos`,
    data: input,
  });

  return data;
};

export default {
  getNftMetadata,
  getNftCollectionMetadata,
};
