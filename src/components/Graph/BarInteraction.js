// @flow

import React, { Component } from "react";
import * as array from "d3-array";
import { BigNumber } from "bignumber.js";
import { View } from "react-native";
import Svg, { G } from "react-native-svg";
import { PanGestureHandler } from "react-native-gesture-handler";

import Bar from "./Bar";

export type Item = {
  date: Date,
  value: BigNumber,
  originalValue: BigNumber,
};

type Props = {
  width: number,
  height: number,
  data: Item[],
  color: string,
  useCounterValue: boolean,
  onItemHover?: (?Item) => void,
  children: *,
  x: *,
  y: *,
};

type State = {
  barVisible: boolean,
  barOffsetX: number,
  barOffsetY: number,
};

const bisectDate = array.bisector(d => d.date).left;

export default class BarInteraction extends Component<Props, State> {
  state = {
    barVisible: false,
    barOffsetX: 0,
    barOffsetY: 0,
  };

  collectHovered = (evt: *, isActive: boolean) => {
    const { data, onItemHover, useCounterValue, x, y } = this.props;
    const x0 = Math.round(evt.nativeEvent.x);
    const hoveredDate = x.invert(x0);
    const i = bisectDate(data, hoveredDate, 1);
    const d0 = data[i - 1];
    const d1 = data[i] || d0;
    const xLeft = x(d0.date);
    const xRight = x(d1.date);
    const d = Math.abs(x0 - xLeft) < Math.abs(x0 - xRight) ? d0 : d1;
    if (onItemHover) onItemHover(isActive ? d : null);
    const value = (useCounterValue ? d.value : d.originalValue).toNumber();
    return {
      barOffsetX: x(d.date),
      barOffsetY: y(value),
    };
  };

  onHandlerStateChange = (e: *) => {
    const barVisible = e.nativeEvent.numberOfPointers > 0;
    const r = this.collectHovered(e, barVisible);
    this.setState({
      barVisible,
      ...r,
    });
  };

  onPanGestureEvent = (e: *) => {
    const r = this.collectHovered(e, true);
    this.setState(oldState => {
      if (
        oldState.barOffsetX === r.barOffsetX &&
        oldState.barOffsetY === r.barOffsetY
      ) {
        return null; // do not setState if the position have not changed.
      }
      return r;
    });
  };

  render() {
    const { width, height, color, children } = this.props;
    const { barVisible, barOffsetX, barOffsetY } = this.state;

    return (
      <PanGestureHandler
        onHandlerStateChange={this.onHandlerStateChange}
        onGestureEvent={this.onPanGestureEvent}
        minDeltaX={10} // nb of pixel to wait before start point
        maxDeltaY={20} // allow to scroll
      >
        <View style={{ width, height, position: "relative" }}>
          {children}
          <Svg
            height={height}
            width={width}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              opacity: barVisible ? 1 : 0,
            }}
          >
            <G x={barOffsetX} y={barOffsetY}>
              <Bar height={height} color={color} />
            </G>
          </Svg>
        </View>
      </PanGestureHandler>
    );
  }
}
