import React, { FC } from "react";
import { StyleSheet, Animated } from "react-native";

import { useTheme } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";
import { useHeaderHeight } from "@react-navigation/elements";

// Number of scrollY pixels to animate 0 -> 1
const OPACITY_ANIMATION_PERIOD = 50;

interface Props {
  readonly title?: string;
  readonly scrollY: Animated.Value;
}

const NftViewerScreenHeader: FC<Props> = ({ title, scrollY }) => {
  const { dark } = useTheme();
  const headerHeight = useHeaderHeight();
  const color = dark ? "#131214" : "#fff";
  const opacity = scrollY.interpolate({
    inputRange: [0, OPACITY_ANIMATION_PERIOD],
    outputRange: [0, 1],
    extrapolateRight: "clamp",
  });
  return (
    <Animated.View style={[styles.root, { height: headerHeight, opacity, backgroundColor: color }]}>
      {title ? (
        <Text
          variant="h5"
          numberOfLines={1}
          lineHeight="48"
          color="neutral.c100"
          ellipsizeMode="tail"
          style={styles.text}
        >
          {title}
        </Text>
      ) : null}
    </Animated.View>
  );
};

export default NftViewerScreenHeader;

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowColor: "#000",
  },
  text: {
    paddingLeft: 56,
    paddingRight: 56,
  },
});
