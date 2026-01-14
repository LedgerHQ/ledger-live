import React, { Component } from "react";
import * as array from "d3-array";
import { View } from "react-native";
import Svg, { G } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
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
  /** Represents the offset to apply to the y-coordinates. Default to 0.  */
  yOffset?: number;
  /** Represents the offset to apply to the x-coordinates. Default to 0.  */
  xOffset?: number;
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
    const { data, onItemHover, mapValue, x, y, xOffset = 0, yOffset = 0 } = this.props;
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
    const result = {
      barOffsetX: x(d.date!) + xOffset,
      barOffsetY: y(value) + yOffset,
    };
    return result;
  };
  onGestureBegin = (x: number) => {
    const r = this.collectHovered(x);
    this.setState({
      barVisible: true,
      ...r,
    });
  };

  onGestureUpdate = (x: number) => {
    const r = this.collectHovered(x);
    if (!r) return;
    this.setState(oldState => {
      if (oldState.barOffsetX === r.barOffsetX && oldState.barOffsetY === r.barOffsetY) {
        return null; // do not setState if the position have not changed.
      }

      return r;
    });
  };

  onGestureEnd = () => {
    const { onItemHover } = this.props;
    if (onItemHover) onItemHover(null);
    this.setState({
      barVisible: false,
    });
  };

  render() {
    const { width, height, color, children } = this.props;
    const { barVisible, barOffsetX, barOffsetY } = this.state;

    const onGestureBegin = this.onGestureBegin;
    const onGestureUpdate = this.onGestureUpdate;
    const onGestureEnd = this.onGestureEnd;

    const panGesture = Gesture.Pan()
      .maxPointers(1)
      .activeOffsetX([-10, 10]) // nb of pixel to wait before start point
      .activeOffsetY([-20, 20]) // allow to scroll
      .activateAfterLongPress(250)
      .onStart(e => {
        "worklet";
        runOnJS(onGestureBegin)(e.x);
      })
      .onUpdate(e => {
        "worklet";
        runOnJS(onGestureUpdate)(e.x);
      })
      .onEnd(() => {
        "worklet";
        runOnJS(onGestureEnd)();
      })
      .onFinalize(() => {
        "worklet";
        runOnJS(onGestureEnd)();
      });

    return (
      <GestureDetector gesture={panGesture}>
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
            <G transform={[{ translateX: barOffsetX }, { translateY: barOffsetY }]}>
              <Bar height={height} color={color} />
            </G>
          </Svg>
        </View>
      </GestureDetector>
    );
  }
}
