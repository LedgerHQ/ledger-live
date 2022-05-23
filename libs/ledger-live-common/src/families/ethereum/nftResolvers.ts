import {
  CurrencyBridge,
  NFTCollectionMetadataResponse,
  NFTMetadataResponse,
} from "../../types";
import { getCryptoCurrencyById } from "../../currencies";
import { metadataCallBatcher } from "../../nft";

const SUPPORTED_CHAIN_IDS = new Set([
  1, // Ethereum
  137, // Polygon
]);

type NftResolvers = NonNullable<CurrencyBridge["nftResolvers"]>;

export const nftMetadata: NftResolvers["nftMetadata"] = async ({
  contract,
  tokenId,
  currencyId,
  metadata,
}): Promise<NFTMetadataResponse> => {
  // This is for test/mock purposes
  if (typeof metadata !== "undefined") {
    return {
      status: 200,
      result: {
        contract,
        tokenId,
        ...metadata,
      },
    } as NFTMetadataResponse;
  }

  const currency = getCryptoCurrencyById(currencyId);
  const chainId = currency?.ethereumLikeInfo?.chainId;

  if (!chainId || !SUPPORTED_CHAIN_IDS.has(chainId)) {
    throw new Error("Ethereum Bridge NFT Resolver: Unsupported chainId");
  }

  const response = (await metadataCallBatcher(currency).loadNft({
    contract,
    tokenId,
  })) as NFTMetadataResponse;

  return response;
};

export const collectionMetadata: NftResolvers["collectionMetadata"] = async ({
  contract,
  currencyId,
  metadata,
}): Promise<NFTCollectionMetadataResponse> => {
  // This is for test/mock purposes
  if (typeof metadata !== "undefined") {
    return {
      status: 200,
      result: {
        contract,
        ...metadata,
      },
    };
  }

  const currency = getCryptoCurrencyById(currencyId);
  const chainId = currency?.ethereumLikeInfo?.chainId;

  if (!chainId || !SUPPORTED_CHAIN_IDS.has(chainId)) {
    throw new Error("Ethereum Bridge NFT Resolver: Unsupported chainId");
  }

  const response = (await metadataCallBatcher(currency).loadCollection({
    contract,
  })) as NFTCollectionMetadataResponse;

  return response;
};

export default { nftMetadata, collectionMetadata };
