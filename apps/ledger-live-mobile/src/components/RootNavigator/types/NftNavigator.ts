import { NFTResource } from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import type { NFTMediaSize, NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import type { StackScreenProps } from "@react-navigation/stack";
import { ScreenName } from "../../../const";

export type NftNavigatorParamList = {
  [ScreenName.NftViewer]: {
    nft: ProtoNFT;
  };
  [ScreenName.NftImageViewer]: {
    metadata: NFTMetadata;
    mediaFormat: NFTMediaSize;
    status: NFTResource["status"];
  };
};

export type NftNavigatorScreenProps<
  RouteName extends keyof NftNavigatorParamList,
> = StackScreenProps<NftNavigatorParamList, RouteName>;
