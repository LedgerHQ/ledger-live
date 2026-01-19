import React from "react";
import { View, StyleSheet } from "react-native";
import SkeletonTile from "../SkeletonTile";

type BannerStatesProps = {
  isError: boolean;
};

export const BannerStates = ({ isError }: BannerStatesProps) => {
  // will be done in next task (Error handling)
  if (isError) {
    return <View />;
  }

  return (
    <View style={styles.container}>
      {Array.from({ length: 8 }, (_, i) => (
        <SkeletonTile index={i} key={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
});
