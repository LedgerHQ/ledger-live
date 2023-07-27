import { NFTCollectionMetadataResponse, NFTMetadataResponse } from "@ledgerhq/types-live";
import { Batcher } from "../batcher/types";

export type NftMetadataInput = {
  contract: string;
  tokenId: string;
};

export type CollectionMetadataInput = {
  contract: string;
};

export type NftRequestsBatcher = {
  loadNft: Batcher<NftMetadataInput, NFTMetadataResponse>;
  loadCollection: Batcher<CollectionMetadataInput, NFTCollectionMetadataResponse>;
};
