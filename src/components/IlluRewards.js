// @flow
import React from "react";
import { Image } from "react-native";
import illuRewardsPng from "../images/rewards.png";

export default function IlluRewards({ style }: any) {
  return (
    <Image style={style} source={illuRewardsPng} width={150} height={150} />
  );
}
