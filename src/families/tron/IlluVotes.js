// @flow
import React from "react";
import { Image } from "react-native";
import votesPng from "../../images/votes.png";

export default function IlluVotes({ style }: *) {
  return <Image style={style} source={votesPng} width={150} height={150} />;
}
