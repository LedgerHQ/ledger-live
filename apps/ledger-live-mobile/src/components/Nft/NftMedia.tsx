import React from "react";
import { VideoProperties } from "react-native-video";
import { FastImageProps } from "react-native-fast-image";
import { NFTMediaSizes, NFTMetadata } from "@ledgerhq/live-common/lib/types";
import { NFTResource } from "@ledgerhq/live-common/lib/nft/NftMetadataProvider/types";
import { Theme } from "@react-navigation/native";
import { getMetadataMediaType } from "../../logic/nft";
import { withTheme } from "../../colors";
import NftImage from "./NftImage";
import NftVideo from "./NftVideo";

type Props = {
  style?: Object;
  status: NFTResource["status"];
  metadata: NFTMetadata;
  mediaFormat: NFTMediaSizes;
  resizeMode?: FastImageProps["resizeMode"] | VideoProperties["resizeMode"];
  colors: Theme;
};

type State = {
  useFallback: boolean;
};

class NftMedia extends React.PureComponent<Props, State> {
  state = {
    useFallback: false,
  };

  setUseFallback = (_useFallback: boolean): void => {
    this.setState({ useFallback: _useFallback });
  };

  render() {
    const { metadata, mediaFormat, colors } = this.props;
    const { useFallback } = this.state;

    const contentType = getMetadataMediaType(metadata, mediaFormat);
    const Component =
      contentType === "video" && !useFallback ? NftVideo : NftImage;

    const { uri, mediaType } =
      metadata?.medias[useFallback ? "preview" : mediaFormat] || {};

    return (
      <Component
        {...this.props}
        colors={colors}
        src={uri}
        mediaType={mediaType}
        useFallback={useFallback}
        setUseFallback={this.setUseFallback}
      />
    );
  }
}

export default withTheme(NftMedia);
