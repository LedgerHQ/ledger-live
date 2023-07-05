import {
  CurrencyBridge,
  NFTCollectionMetadataResponse,
  NFTMetadataResponse,
} from "@ledgerhq/types-live";
import { metadataCallBatcher } from "@ledgerhq/coin-framework/nft/support";
import { getCryptoCurrencyById } from "../../currencies";
import { apiForCurrency } from "./api";

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

  const api = apiForCurrency(currency);
  const response = await metadataCallBatcher(currency, api).loadNft({
    contract,
    tokenId,
  });

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

  const api = apiForCurrency(currency);
  const response = await metadataCallBatcher(currency, api).loadCollection({
    contract,
  });

  return response;
};

export default { nftMetadata, collectionMetadata };
