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
import colors from "../colors";
import { formatCurrencyUnit } from "@ledgerhq/currencies";
import getFontStyle from "./LText/getFontStyle";
import { Defs } from "react-native-svg";
import BalanceChartGradient from "./BalanceChartGradient";

export default class BalanceChart extends PureComponent {
  static defaultProps = {
    color: colors.blue
  };
  render() {
    const { width, height, unit, data, color } = this.props;
    return (
      <VictoryChart
        width={width}
        height={height}
        scale={{ x: "time" }}
        containerComponent={
          <VictoryCursorContainer
            cursorDimension="x"
            cursorLabel={d => formatCurrencyUnit(unit, d.y, { showCode: true })}
          />
        }
      >
        <Defs>
          <BalanceChartGradient id="bgFillGradient" color={color} />
        </Defs>
        <VictoryArea
          x="date"
          y="value"
          data={data}
          animate={{
            duration: 2000,
            onLoad: { duration: 1000 }
          }}
          style={{
            data: {
              fill: "url(#bgFillGradient)",
              stroke: color,
              strokeWidth: 2
            }
          }}
        />
        <VictoryAxis
          dependentAxis
          tickLabelComponent={
            <VictoryLabel
              style={{
                fill: "rgba(0,0,0,0.3)",
                fontSize: 12,
                ...getFontStyle()
              }}
              text={
                data =>
                  "$" +
                  data / 100000 +
                  "k" /* FIXME part of the currency formatter */
              }
            />
          }
          style={{
            grid: {
              stroke: "rgba(0,0,0,0.1)",
              strokeDasharray: [3, 4]
            },
            axis: { stroke: "none" }
          }}
        />
        <VictoryAxis
          tickLabelComponent={
            <VictoryLabel
              style={{
                fill: "rgba(0,0,0,0.3)",
                fontSize: 9,
                ...getFontStyle()
              }}
            />
          }
          style={{ axis: { stroke: "none" } }}
        />
      </VictoryChart>
    );
  }
}
