import React from "react";
import { StyleProp, ImageStyle, Image } from "react-native";
import VotesPng from "~/images/votes.webp";

const Votes = ({ style }: { style?: StyleProp<ImageStyle> }) => (
  <Image
    style={[
      {
        width: 150,
        height: 136,
      },
      style,
    ]}
    source={VotesPng}
  />
);

export default Votes;
