import {
  CollectionMetadataInput,
  NftMetadataInput,
} from "@ledgerhq/ledger-wallet-framework/nft/types";
import network from "@ledgerhq/live-network";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { NFTCollectionMetadataResponse, NFTMetadataResponse } from "@ledgerhq/types-live";
import coinConfig from "../../config";

export type NftMetdataParams = { chainId: number; currencyId: string };

// Read per call: the metadata batcher caches its params per currency for the app's lifetime.
const nftMetadataServiceUrl = (params: NftMetdataParams): string =>
  coinConfig.getCoinConfig(params.currencyId).infra.NFT_METADATA_SERVICE;

/**
 * Batched request of nft metadata on the "solana" protocol
 *
 * ⚠️ solana protocol doesn't mean solana chain, you can see this
 * as the svm protocol instead, and you can specify a chainId
 * to request the metadata on any svm chain supported
 */
export const getNftMetadata = async (
  input: NftMetadataInput[],
  params: NftMetdataParams,
): Promise<NFTMetadataResponse[]> => {
  const { data }: { data: NFTMetadataResponse[] } = await network({
    method: "POST",
    url: `${nftMetadataServiceUrl(params)}/v2/solana/${params.chainId}/contracts/tokens/infos`,
    data: input,
  });

  return data;
};

/**
 * Batched request of nft collection metadata on the "solana" protocol
 *
 * ⚠️ solana protocol doesn't mean solana chain, you can see this
 * as the svm protocol instead, and you can specify a chainId
 * to request the metadata on any svm chain supported
 */
export const getNftCollectionMetadata = async (
  input: CollectionMetadataInput[],
  params: NftMetdataParams,
): Promise<NFTCollectionMetadataResponse[]> => {
  const { data }: { data: NFTCollectionMetadataResponse[] } = await network({
    method: "POST",
    url: `${nftMetadataServiceUrl(params)}/v2/solana/${params.chainId}/contracts/infos`,
    data: input,
  });

  return data;
};

/**
 * Get the correct chain from a given currency
 */
export const getParams = (currency: CryptoCurrency): NftMetdataParams => {
  switch (currency.id) {
    case "solana":
      return { chainId: 101, currencyId: currency.id };
    case "solana_testnet":
      return { chainId: 102, currencyId: currency.id };
    case "solana_devnet":
      return { chainId: 103, currencyId: currency.id };
    default:
      throw new Error(`Solana: No chainId for this Currency (${currency.id}})`);
  }
};

export default {
  getNftMetadata,
  getNftCollectionMetadata,
  getParams,
};
