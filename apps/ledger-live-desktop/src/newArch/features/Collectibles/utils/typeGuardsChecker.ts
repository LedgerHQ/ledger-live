import { NFTMetadata } from "@ledgerhq/types-live";
import { NftRowProps, OrdinalsRowProps, RowProps as Props } from "../types/Collection";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";

export function isNFTRow(props: Props): props is Props & NftRowProps {
  return "media" in props && !("collectionName" in props);
}

export function isOrdinalsRow(props: Props): props is Props & OrdinalsRowProps {
  return "rareSatName" in props;
}

export const isNFTMetadata = (
  metadata: NFTMetadata | SimpleHashNft["extra_metadata"],
): metadata is NFTMetadata => {
  return !!metadata && "links" in metadata;
};
