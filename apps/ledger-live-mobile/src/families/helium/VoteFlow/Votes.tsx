import React from "react";
import { Image } from "react-native";
import VotesPng from "../../../images/votes.png";

const defaultStyle = {
  width: 154,
  height: 154,
};

const Votes = ({ style }: any) => (
  <Image style={[defaultStyle, style]} source={VotesPng} />
);

export default Votes;
