import React from "react";
import { Image } from "react-native";
import RewardsPng from "../../images/rewards.png";

const Rewards = ({ style }: any) => (
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
