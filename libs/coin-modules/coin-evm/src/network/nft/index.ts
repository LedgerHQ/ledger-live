import { CollectionMetadataInput, NftMetadataInput } from "@ledgerhq/coin-framework/nft/types";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { NFTCollectionMetadataResponse, NFTMetadataResponse } from "@ledgerhq/types-live";

export type NftMetdataParams = { chainId: number };

/**
 * Batched request of nft metadata on the "ethereum" protocol
 *
 * ⚠️ ethereum protocol doesn't mean ethereum chain, you can see this
 * as the evm protocol instead, and you can specify a chainId
 * to request the metadata on any evm chain supported
 */
export const getNftMetadata = async (
  input: NftMetadataInput[],
  params: NftMetdataParams,
): Promise<NFTMetadataResponse[]> => {
  const { data }: { data: NFTMetadataResponse[] } = await network({
    method: "POST",
    url: `${getEnv("NFT_METADATA_SERVICE")}/v2/ethereum/${params.chainId}/contracts/tokens/infos`,
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
  params: NftMetdataParams,
): Promise<NFTCollectionMetadataResponse[]> => {
  const { data }: { data: NFTCollectionMetadataResponse[] } = await network({
    method: "POST",
    url: `${getEnv("NFT_METADATA_SERVICE")}/v2/ethereum/${params.chainId}/contracts/infos`,
    data: input,
  });

  return data;
};

/**
 * Get the correct chain from a given currency
 */
export const getParams = (currency: CryptoCurrency): NftMetdataParams => {
  const chainId = currency?.ethereumLikeInfo?.chainId;

  if (!chainId) {
    throw new Error("Ethereum: No chainId for this Currency");
  }

  return { chainId };
};

export default {
  getNftMetadata,
  getNftCollectionMetadata,
  getParams,
};
