import React from "react";
import { VideoProperties } from "react-native-video";
import { FastImageProps } from "react-native-fast-image";
import { NFTMediaSize, NFTMetadata } from "@ledgerhq/types-live";
import { NFTResource } from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import { Theme } from "@react-navigation/native";
import { getMetadataMediaType } from "../../logic/nft";
import { withTheme } from "../../colors";
import NftImage from "./NftImage";
import NftVideo from "./NftVideo";

type Props = {
  style?: any;
  status: NFTResource["status"];
  metadata: NFTMetadata;
  mediaFormat: NFTMediaSize;
  resizeMode?: FastImageProps["resizeMode"] | VideoProperties["resizeMode"];
  colors: Theme;
  transaprency?: boolean;
};

type State = {
  useFallback: boolean;
};

class NftMedia extends React.PureComponent<Props, State> {
  render() {
    const { metadata, mediaFormat, colors, status } = this.props;

    let { uri, mediaType } = metadata?.medias?.[mediaFormat] || {};
    let contentType = getMetadataMediaType(metadata, mediaFormat);

    const noData = status === "nodata";
    const metadataError = status === "error";
    const noSource = status === "loaded" && !uri;

    if (noData || metadataError || noSource) {
      uri = metadata?.medias?.preview?.uri;
      mediaType = metadata?.medias?.preview?.mediaType;
      contentType = getMetadataMediaType(metadata, "preview");
    }

    const Component = contentType === "video" ? NftVideo : NftImage;

    return (
      <Component
        {...this.props}
        colors={colors}
        src={uri}
        srcFallback={metadata?.medias?.preview?.uri}
        mediaType={mediaType}
      />
    );
  }
}

export default withTheme(NftMedia);
