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
  height: number,
  color: string,
};

const STROKE_WIDTH = 2;
const FOCUS_RADIUS = 4;

export default class Bar extends PureComponent<Props> {
  render() {
    const { height, color } = this.props;
    return (
      <Fragment>
        <Line
          x1={0}
          x2={0}
          y1={0}
          y2={height}
          stroke={rgba(color, 0.2)}
          strokeWidth={FOCUS_RADIUS}
        />
        <Circle
          cx={0}
          cy={0}
          r={5}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="white"
        />
      </Fragment>
    );
  }
}
