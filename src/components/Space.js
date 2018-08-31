// @flow

import React, { PureComponent } from "react";
import { View } from "react-native";

type Props = {
  w?: number,
  h?: number,
};

export default class Space extends PureComponent<Props> {
  render() {
    const { w, h } = this.props;
    return <View style={{ width: w, height: h }} />;
  }
}
