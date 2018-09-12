// @flow

import React, { PureComponent, Fragment } from "react";
import { BigNumber } from "bignumber.js";
import { Line, Circle } from "react-native-svg";

import { rgba } from "../../colors";

export type Item = {
  date: Date,
  value: BigNumber,
  originalValue: BigNumber,
};

type Props = {
  x: number,
  y: number,
  height: number,
  color: string,
};

const STROKE_WIDTH = 2;
const FOCUS_RADIUS = 4;

export default class Bar extends PureComponent<Props> {
  render() {
    const { x, y, height, color } = this.props;
    return (
      <Fragment>
        <Line
          x1={x}
          x2={x}
          y1={y}
          y2={height}
          stroke={rgba(color, 0.2)}
          strokeWidth={FOCUS_RADIUS}
        />
        <Circle
          cx={x}
          cy={y}
          r={5}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="white"
        />
      </Fragment>
    );
  }
}
