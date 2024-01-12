import React from "react";
import { StyleProp, ImageStyle, Image } from "react-native";
import RewardsPng from "~/images/rewards.png";

const Rewards = ({ style }: { style?: StyleProp<ImageStyle> }) => (
  <Image
    style={[
      {
        width: 150,
        height: 150,
      },
      style,
    ]}
    source={RewardsPng}
  />
);

export default Rewards;
