import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";
import votesPng from "../../images/votes.png";

const defaultStyle = {
  width: 150,
  height: 150,
};
export default function IlluVotes({
  style,
}: {
  style?: StyleProp<ImageStyle>;
}) {
  return <Image style={[defaultStyle, style]} source={votesPng} />;
}
