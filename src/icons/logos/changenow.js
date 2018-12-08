// @flow

import React from "react";
import { Image } from "react-native";

// img dimension 450*280
// ratio 0.62222

type Props = {
  width: number,
};

const ChangeNow = ({ width }: Props) => (
  <Image
    resizeMode="contain"
    style={{ width, height: width * 0.6222 }}
    source={require("../../images/exchanges/ChangeNOW.png")}
  />
);

export default ChangeNow;
