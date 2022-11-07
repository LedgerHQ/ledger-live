import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";
import illustakingPng from "./illustaking.png";

const defaultStyle = {
  width: 113,
  height: 154,
};

const IlluStaking = ({ style }: { style?: StyleProp<ImageStyle> }) => (
  <Image style={[defaultStyle, style]} source={illustakingPng} />
);

export default IlluStaking;
