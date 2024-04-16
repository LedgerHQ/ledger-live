import {
  CurrencyBridge,
  NFTCollectionMetadataResponse,
  NFTMetadataResponse,
} from "@ledgerhq/types-live";
import { isNFTActive, metadataCallBatcher } from "@ledgerhq/coin-framework/nft/support";
import { getCryptoCurrencyById } from "@ledgerhq/coin-framework/currencies/index";
import NftApi from "./api/nft";

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
  if (!isNFTActive(currency)) {
    throw new Error("Ethereum Bridge NFT Resolver: Unsupported currency");
  }

  const response = await metadataCallBatcher(currency, NftApi).loadNft({
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
  if (!isNFTActive(currency)) {
    throw new Error("Ethereum Bridge NFT Resolver: Unsupported currency");
  }

  const response = await metadataCallBatcher(currency, NftApi).loadCollection({
    contract,
  });

  return response;
};

export default { nftMetadata, collectionMetadata };
