import React from "react";
import { View, StyleSheet } from "react-native";
import NftMedia from "./NftMedia";
import { ScreenName } from "../../const";
import type { NftNavigatorParamList } from "../RootNavigator/types/NftNavigator";
import type { StackNavigatorProps } from "../RootNavigator/types/helpers";

type Props = StackNavigatorProps<
  NftNavigatorParamList,
  ScreenName.NftImageViewer
>;

const NftImageViewer = ({ route }: Props) => {
  const { params } = route;

  return (
    <View style={styles.imageContainer}>
      <NftMedia
        style={styles.image}
        metadata={params.metadata}
        mediaFormat={params.mediaFormat}
        status={params?.status}
        resizeMode="contain"
        transparency={true}
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

export default NftImageViewer;
