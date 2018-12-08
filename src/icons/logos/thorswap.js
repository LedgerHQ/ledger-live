// @flow

import React from "react";
import { Image } from "react-native";

// img dimension 1672*424
// ratio 0,2535

type Props = {
  width: number,
};

const ThorSwap = ({ width }: Props) => (
  <Image
    style={{ width, height: width * 0.2535 }}
    source={require("../../images/exchanges/thor-swap.png")}
  />
);

export default ThorSwap;
