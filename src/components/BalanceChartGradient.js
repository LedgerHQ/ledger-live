//@flow
import React, { PureComponent } from "react";
import { G, Line, Defs, LinearGradient, Stop } from "react-native-svg";
import colors from "../colors";

export default class BalanceChartGradient extends PureComponent<*> {
  render() {
    const { color, id } = this.props;
    return (
      <LinearGradient id={id} x1="0%" y="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity={0.5} />
        <Stop offset="90%" stopColor={color} stopOpacity={0} />
      </LinearGradient>
    );
  }
}
