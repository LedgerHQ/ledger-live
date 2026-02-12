import { isNFTActive, metadataCallBatcher } from "@ledgerhq/coin-framework/nft/support";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { CurrencyBridge } from "@ledgerhq/types-live";
import NftApi from "./network/nft";

type NftResolvers = NonNullable<CurrencyBridge["nftResolvers"]>;

export const nftMetadata: NftResolvers["nftMetadata"] = async ({
  contract,
  tokenId,
  currencyId,
}) => {
  const currency = getCryptoCurrencyById(currencyId);
  if (!isNFTActive(currency)) {
    throw new Error(`Solana Bridge NFT Resolver: Unsupported currency (${currency.id})`);
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
}) => {
  const currency = getCryptoCurrencyById(currencyId);
  if (!isNFTActive(currency)) {
    throw new Error(`Solana Bridge NFT Resolver: Unsupported currency (${currency.id})`);
  }

  const response = await metadataCallBatcher(currency, NftApi).loadCollection({
    contract,
  });

  return response;
};

export default { nftMetadata, collectionMetadata };
