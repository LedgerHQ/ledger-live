import React, { FC } from "react";
import { View, StyleSheet, Image, useWindowDimensions } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { useTheme } from "@react-navigation/native";

// This negative offset is applied to make sure that the background
// is visible when the scrollview is pulled down or on scroll bounce.
const NEGATIVE_TOP_OFFSET = 300;
const BLUR_RADIUS = 25;

interface Props {
  readonly src: string;
}

const NftViewerBackground: FC<Props> = ({ src }) => {
  const { height } = useWindowDimensions();
  const { dark } = useTheme();
  const gradientColor = dark ? "#131214" : "#fff";
  return (
    <View style={styles.root}>
      <Image
        blurRadius={BLUR_RADIUS}
        style={[styles.image, { height: height + NEGATIVE_TOP_OFFSET }]}
        source={{
          uri: src,
        }}
      />
      <Svg style={styles.gradient}>
        <Defs>
          <LinearGradient
            id="myGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop key="45%" offset="45%" stopOpacity={0.4} stopColor={gradientColor} />
            <Stop key="95%" offset="95%" stopOpacity={1} stopColor={gradientColor} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#myGradient)" />
      </Svg>
    </View>
  );
};

export default NftViewerBackground;

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: -NEGATIVE_TOP_OFFSET,
    left: 0,
    right: 0,
  },
  image: {
    transform: [{ rotate: "180deg" }],
    height: "100%",
    width: "100%",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
