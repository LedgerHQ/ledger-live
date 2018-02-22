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
import { G, Line, Defs, LinearGradient, Stop } from "react-native-svg";
import colors from "../colors";
import { formatCurrencyUnit } from "@ledgerhq/currencies";
import getFontStyle from "./LText/getFontStyle";

export default class BalanceChart extends PureComponent {
  render() {
    const { width, height, unit, data, granularity } = this.props;
    const Gradient = ({ index }) => <Defs key={index}>{blueGradient}</Defs>;
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
          <LinearGradient id="bgFillGradient" x1="0%" y="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.blue} stopOpacity={0.5} />
            <Stop offset="90%" stopColor={colors.blue} stopOpacity={0} />
          </LinearGradient>
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
              stroke: colors.blue,
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
