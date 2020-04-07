// @flow
import React from "react";
import { Image } from "react-native";
import illuRewardsPng from "../../images/rewards.png";

const IlluRewards = ({ style }: any) => (
  <Image style={style} source={illuRewardsPng} width={150} height={150} />
);

export default IlluRewards;
