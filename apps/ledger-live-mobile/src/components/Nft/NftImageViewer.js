// @flow

import React from "react";
import { View, StyleSheet } from "react-native";
import NftImage from "./NftImage";

// import PanAndZoomView from "../PanAndZoomView";

type Props = {
  route: {
    params?: RouteParams,
  },
};

type RouteParams = {
  media: string,
  status: string,
};

const NftViewer = ({ route }: Props) => {
  // T
  const { params } = route;

  return (
    <View style={styles.imageContainer}>
      <NftImage
        src={params?.media}
        status={params?.status}
        style={styles.image}
        hackWidth={10000}
        resizeMode="contain"
      />
    </View>
  );
};

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

export default NftViewer;
