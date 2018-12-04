// @flow

// img dimension 800*328
// ratio 0.41

import React from "react";
import { Image } from "react-native";

type Props = {
  width: number,
};

const KyberSwap = ({ width }: Props) => (
  <Image
    style={{ width, height: width * 0.41 }}
    source={require("../../images/exchanges/kyber-swap.png")}
  />
);

export default KyberSwap;
