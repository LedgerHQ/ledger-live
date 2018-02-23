import React, { Component, PureComponent } from "react";
import { View } from "react-native";
import {
  VictoryChart,
  VictoryLabel,
  VictoryArea,
  VictoryAxis,
  VictoryCursorContainer,
  Point
} from "victory-native";
import { Svg, Defs } from "react-native-svg";
import BalanceChartGradient from "./BalanceChartGradient";
import colors from "../colors";

export default class BalanceChartMiniature extends PureComponent {
  static defaultProps = {
    color: colors.blue,
    withGradient: true,
    padding: 5
  };
  render() {
    const { width, height, data, color, withGradient, padding } = this.props;
    return (
      <Svg height={height} width={width}>
        <Defs>
          <BalanceChartGradient id="bgFillGradient" color={color} />
        </Defs>
        <VictoryArea
          standalone={false}
          width={width}
          height={height}
          scale={{ x: "time" }}
          x="date"
          y="value"
          data={data}
          padding={padding}
          style={{
            data: {
              fill: withGradient ? "url(#bgFillGradient)" : "transparent",
              stroke: color,
              strokeWidth: 2
            }
          }}
        />
      </Svg>
    );
  }
}
