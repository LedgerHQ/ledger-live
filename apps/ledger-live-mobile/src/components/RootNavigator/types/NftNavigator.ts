import { NFTResource } from "@ledgerhq/live-nft/types";
import type { NFTMediaSize, NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type NftNavigatorParamList = {
  [ScreenName.NftViewer]: {
    nft: ProtoNFT;
  };
  [ScreenName.NftImageViewer]: {
    metadata: NFTMetadata;
    mediaFormat: NFTMediaSize;
    status: NFTResource["status"];
  };
  [ScreenName.HiddenNftCollections]: undefined;
};
