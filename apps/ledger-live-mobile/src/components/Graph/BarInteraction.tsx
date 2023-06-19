import React, { Component } from "react";
import * as array from "d3-array";
import { View } from "react-native";
import Svg, { G } from "react-native-svg";
import {
  PanGestureHandler,
  State,
  LongPressGestureHandler,
  HandlerStateChangeEvent,
  PanGestureHandlerEventPayload,
  LongPressGestureHandlerEventPayload,
  GestureEvent,
} from "react-native-gesture-handler";
import { ScaleContinuousNumeric, ScaleTime } from "d3-scale";
import type { Item, ItemArray } from "./types";
import Bar from "./Bar";

type Props = {
  width: number;
  height: number;
  data: ItemArray;
  color: string;
  mapValue: (_: Item) => number;
  onItemHover?: (_: Item | null | undefined) => void;
  children: React.ReactNode;
  x: ScaleContinuousNumeric<number, number> | ScaleTime<number, number>;
  y: ScaleContinuousNumeric<number, number> | ScaleTime<number, number>;
};
const bisectDate = array.bisector((d: { date?: Date | null | number }) => d.date).left;
export default class BarInteraction extends Component<
  Props,
  {
    barVisible: boolean;
    barOffsetX: number;
    barOffsetY: number;
  }
> {
  state = {
    barVisible: false,
    barOffsetX: 0,
    barOffsetY: 0,
  };
  collectHovered = (xPos: number) => {
    const { data, onItemHover, mapValue, x, y } = this.props;
    const x0 = Math.round(xPos);
    const hoveredDate = x.invert(x0);
    const i = bisectDate(data, hoveredDate, 1);
    const d0 = data[i - 1];
    const d1 = data[i] || d0;
    const xLeft = x(d0.date!);
    const xRight = x(d1.date!);
    const d = Math.abs(x0 - xLeft) < Math.abs(x0 - xRight) ? d0 : d1;
    if (onItemHover) onItemHover(d);
    const value = mapValue(d);
    return {
      barOffsetX: x(d.date!),
      barOffsetY: y(value),
    };
  };
  onHandlerStateChange = (
    e: HandlerStateChangeEvent<PanGestureHandlerEventPayload | LongPressGestureHandlerEventPayload>,
  ) => {
    const { nativeEvent } = e;

    if (nativeEvent.state === State.ACTIVE) {
      const r = this.collectHovered(nativeEvent.x);
      this.setState({
        barVisible: true,
        ...r,
      });
    } else if (nativeEvent.state === State.END || nativeEvent.state === State.CANCELLED) {
      const { onItemHover } = this.props;
      if (onItemHover) onItemHover(null);
      this.setState({
        barVisible: false,
      });
    }
  };
  onPanGestureEvent = (
    e: GestureEvent<PanGestureHandlerEventPayload | LongPressGestureHandlerEventPayload>,
  ) => {
    const r = this.collectHovered(e.nativeEvent.x);
    if (!r) return;
    this.setState(oldState => {
      if (oldState.barOffsetX === r.barOffsetX && oldState.barOffsetY === r.barOffsetY) {
        return null; // do not setState if the position have not changed.
      }

      return r;
    });
  };

  render() {
    const { width, height, color, children } = this.props;
    const { barVisible, barOffsetX, barOffsetY } = this.state;
    const panRef = React.createRef();
    const longPressRef = React.createRef();
    return (
      <PanGestureHandler
        onHandlerStateChange={this.onHandlerStateChange}
        onGestureEvent={this.onPanGestureEvent}
        maxPointers={1}
        activeOffsetX={[-10, 10]} // nb of pixel to wait before start point
        activeOffsetY={[-20, 20]} // allow to scroll
        simultaneousHandlers={longPressRef}
      >
        <LongPressGestureHandler
          onHandlerStateChange={this.onHandlerStateChange}
          onGestureEvent={this.onPanGestureEvent}
          simultaneousHandlers={panRef}
        >
          <View
            style={{
              width,
              height,
              position: "relative",
            }}
            collapsable={false}
          >
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
        </LongPressGestureHandler>
      </PanGestureHandler>
    );
  }
}
