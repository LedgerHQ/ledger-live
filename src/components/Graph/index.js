// @flow

import React, { PureComponent } from "react";
import * as array from "d3-array";
import * as shape from "d3-shape";
import * as scale from "d3-scale";
import { BigNumber } from "bignumber.js";
import { View } from "react-native";
import maxBy from "lodash/maxBy";
import Svg, { Path, Defs } from "react-native-svg";

import colors from "../../colors";
import DefGraph from "./DefGrad";
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
  isInteractive: boolean,
  useCounterValue: boolean,
  onItemHover?: Item => void,
  onPanResponderStart?: () => *,
  onPanResponderRelease?: () => *,
};

type State = {
  barVisible: boolean,
  barOffsetX: number,
  barOffsetY: number,
};

const STROKE_WIDTH = 2;
const FOCUS_RADIUS = 4;
const bisectDate = array.bisector(d => d.date).left;

export default class Graph extends PureComponent<Props, State> {
  static defaultProps = {
    data: [],
    color: colors.live,
    isInteractive: false,
    useCounterValue: false,
  };

  state = {
    barVisible: false,
    barOffsetX: 0,
    barOffsetY: 0,
  };

  x: * = null;

  y: * = null;

  collectHovered = (evt: *) => {
    const { data, onItemHover, useCounterValue } = this.props;
    const x0 = Math.round(evt.nativeEvent.locationX);
    const hoveredDate = this.x.invert(x0);
    const i = bisectDate(data, hoveredDate, 1);
    const d0 = data[i - 1];
    const d1 = data[i] || d0;
    const xLeft = this.x(d0.date);
    const xRight = this.x(d1.date);
    const d = Math.abs(x0 - xLeft) < Math.abs(x0 - xRight) ? d0 : d1;
    if (onItemHover) onItemHover(d);
    const value = (useCounterValue ? d.value : d.originalValue).toNumber();
    return {
      barOffsetX: this.x(d.date),
      barOffsetY: this.y(value),
    };
  };

  onStartShouldSetResponder = () => true;

  onResponderGrant = (evt: *) => {
    const { onPanResponderStart } = this.props;
    if (onPanResponderStart) onPanResponderStart();
    this.setState({ barVisible: true, ...this.collectHovered(evt) });
  };

  onResponderMove = (evt: *) => {
    const r = this.collectHovered(evt);
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

  onResponderRelease = () => {
    const { onPanResponderRelease } = this.props;
    if (onPanResponderRelease) onPanResponderRelease();
    this.setState({ barVisible: false });
  };

  render() {
    const {
      width,
      height,
      data,
      color,
      isInteractive,
      useCounterValue,
    } = this.props;
    const { barVisible, barOffsetX, barOffsetY } = this.state;

    const maxY = useCounterValue
      ? maxBy(data, d => d.value.toNumber()).value.toNumber()
      : maxBy(data, d => d.originalValue.toNumber()).originalValue.toNumber();

    const yExtractor = useCounterValue
      ? d => this.y(d.value.toNumber())
      : d => this.y(d.originalValue.toNumber());

    const curve = useCounterValue ? shape.curveLinear : shape.curveStepBefore;

    this.x = scale
      .scaleTime()
      .range([0, width])
      .domain([data[0].date, data[data.length - 1].date]);

    this.y = scale
      .scaleLinear()
      .range([height - STROKE_WIDTH, STROKE_WIDTH + FOCUS_RADIUS])
      .domain([0, maxY]);

    const area = shape
      .area()
      .x(d => this.x(d.date))
      .y0(this.y(0))
      .y1(yExtractor)
      .curve(curve)(data);

    const line = shape
      .line()
      .x(d => this.x(d.date))
      .y(yExtractor)
      .curve(curve)(data);

    const responderProps = isInteractive
      ? {
          onStartShouldSetResponder: this.onStartShouldSetResponder,
          onResponderGrant: this.onResponderGrant,
          onResponderMove: this.onResponderMove,
          onResponderRelease: this.onResponderRelease,
          onResponderTerminate: this.onResponderRelease,
        }
      : null;

    return (
      <View style={{ width, height }} {...responderProps}>
        <Svg height={height} width={width}>
          <Defs>
            <DefGraph height={height} color={color} />
          </Defs>
          <Path d={area} fill="url(#grad)" />
          <Path
            d={line}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {!barVisible ? null : (
            <Bar x={barOffsetX} y={barOffsetY} height={height} color={color} />
          )}
        </Svg>
      </View>
    );
  }
}
