import { CurrencyBridge, NFTMetadataResponse } from "../../types";
import { getCryptoCurrencyById } from "../../currencies";
import { metadataCallBatcher } from "../../nft";

const SUPPORTED_CHAIN_IDS = new Set([
  1, // Ethereum
  137, // Polygon
]);

const nftMetadataResolver: CurrencyBridge["nftMetadataResolver"] = async ({
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
    };
  }

  const currency = getCryptoCurrencyById(currencyId);
  const chainId = currency?.ethereumLikeInfo?.chainId;

  if (!chainId || !SUPPORTED_CHAIN_IDS.has(chainId)) {
    throw new Error("Ethereum Bridge NFT Resolver: Unsupported chainId");
  }

  const response = await metadataCallBatcher(currency).load({
    contract,
    tokenId,
  });

  return response;
};

export default nftMetadataResolver;
