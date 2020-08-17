// @flow
import React from "react";
import { Image } from "react-native";
import RewardsPng from "../../images/rewards.png";

const Rewards = ({ style }: any) => (
  <Image style={style} source={RewardsPng} width={150} height={150} />
);

export default Rewards;
