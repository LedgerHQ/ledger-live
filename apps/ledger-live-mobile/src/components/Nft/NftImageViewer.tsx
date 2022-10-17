import React from "react";
import { View, StyleSheet } from "react-native";
import { NFTMediaSize, NFTMetadata } from "@ledgerhq/types-live";
import { NFTResource } from "@ledgerhq/live-common/nft/NftMetadataProvider/types";
import NftMedia from "./NftMedia";

type Props = {
  route: {
    params: RouteParams;
  };
};

type RouteParams = {
  metadata: NFTMetadata;
  mediaFormat: NFTMediaSize;
  status: NFTResource["status"];
};

class NftImageViewer extends React.PureComponent<Props> {
  static defaultProps = {
    mediaFormat: "big",
    status: "loaded",
  };

  render() {
    const { route } = this.props;
    const { params } = route;

    return (
      <View style={styles.imageContainer}>
        <NftMedia
          style={styles.image}
          metadata={params.metadata}
          mediaFormat={params.mediaFormat}
          status={params?.status}
          resizeMode="contain"
          transaprency={true}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    justifyContent: "center",
  },
  image: {
    position: "absolute",
    height: "100%",
    width: "100%",
    overflow: "hidden",
  },
});

export default NftImageViewer;
