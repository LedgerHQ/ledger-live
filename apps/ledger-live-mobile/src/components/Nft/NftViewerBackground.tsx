import React, { FC } from "react";
import { View, StyleSheet, Image, Animated } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { useTheme } from "@react-navigation/native";

// Number of scrollY pixels to animate 1 -> 0
const OPACITY_ANIMATION_PERIOD = 200;
const BLUR_RADIUS = 45;

interface Props {
  readonly src: string;
  readonly scrollY: Animated.Value;
}

const NftViewerBackground: FC<Props> = ({ src, scrollY }) => {
  const { dark } = useTheme();
  const gradientColor = dark ? "#131214" : "#fff";
  const overlayColor = dark ? "#000" : "#fff";
  const opacity = scrollY.interpolate({
    inputRange: [0, OPACITY_ANIMATION_PERIOD],
    outputRange: [1, 0],
    extrapolateRight: "clamp",
  });
  return (
    <Animated.View style={[styles.root]}>
      {/* NOTE: We have to aniamte the image only, iOs works fine animating out the entire
      view but Android doesn't play nice with the gradient and the text in the content
      becomes ineligible for a brief time when scrolling */}
      <Animated.View style={[styles.imageContainer, { opacity }]}>
        <Image
          blurRadius={BLUR_RADIUS}
          style={[styles.image]}
          source={{
            uri: src,
          }}
        />
      </Animated.View>
      <View style={[styles.overlay, { backgroundColor: overlayColor }]} />
      <Svg style={styles.gradient}>
        <Defs>
          <LinearGradient id="myGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop key="0%" offset="0%" stopOpacity={0} stopColor={gradientColor} />
            <Stop key="100%" offset="100%" stopOpacity={1} stopColor={gradientColor} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#myGradient)" />
      </Svg>
    </Animated.View>
  );
};

export default NftViewerBackground;

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  imageContainer: {
    transform: [{ rotate: "180deg" }],
    height: "100%",
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
