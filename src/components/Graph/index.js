// @flow

import React, { PureComponent, Fragment } from "react";
import * as array from "d3-array";
import * as shape from "d3-shape";
import * as scale from "d3-scale";
import { BigNumber } from "bignumber.js";
import { View } from "react-native";
import maxBy from "lodash/maxBy";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Circle,
} from "react-native-svg";

import colors, { rgba } from "../../colors";

export type Item = {
  date: Date,
  value: BigNumber,
};

type Props = {
  height: number,
  data: Item[],
  color: string,
  isInteractive: boolean,
  onItemHover?: Item => void,
  onPanResponderStart?: () => *,
  onPanResponderRelease?: () => *,
};

type State = {
  width: number,
  barVisible: boolean,
  barOffsetX: number,
  hoveredItem: ?Item,
};

const STROKE_WIDTH = 2;
const FOCUS_RADIUS = 4;
const bisectDate = array.bisector(d => d.date).left;

export default class Graph extends PureComponent<Props, State> {
  static defaultProps = {
    height: 100,
    data: [],
    color: colors.live,
    isInteractive: false,
  };

  state = {
    width: 0,
    barVisible: false,
    barOffsetX: 0,
    hoveredItem: null,
  };

  x: * = null;
  y: * = null;

  onLayout = ({
    nativeEvent: {
      layout: { width },
    },
  }: *) => this.setState({ width });

  collectHovered = (evt: *) => {
    const { data, onItemHover } = this.props;
    const x0 = Math.round(evt.nativeEvent.locationX);
    const hoveredDate = this.x.invert(x0);
    const i = bisectDate(data, hoveredDate, 1);
    const d0 = data[i - 1];
    const d1 = data[i] || d0;
    const xLeft = this.x(d0.date);
    const xRight = this.x(d1.date);
    const d = Math.abs(x0 - xLeft) < Math.abs(x0 - xRight) ? d0 : d1;
    if (onItemHover) onItemHover(d);
    return {
      hoveredItem: d,
      barOffsetX: this.x(d.date),
    };
  };

  onStartShouldSetResponder = () => true;
  onResponderGrant = (evt: *) => {
    const { onPanResponderStart } = this.props;
    if (onPanResponderStart) onPanResponderStart();
    this.setState({ barVisible: true, ...this.collectHovered(evt) });
  };

  onResponderMove = (evt: *) => this.setState(this.collectHovered(evt));
  onResponderRelease = () => {
    const { onPanResponderRelease } = this.props;
    if (onPanResponderRelease) onPanResponderRelease();
    this.setState({ barVisible: false });
  };

  render() {
    const { height, data, color, isInteractive } = this.props;
    const { width, barVisible, barOffsetX, hoveredItem } = this.state;

    this.x = scale
      .scaleTime()
      .range([0, width])
      .domain([data[0].date, data[data.length - 1].date]);

    const maxY = maxBy(data, d => d.value.toNumber()).value.toNumber();

    this.y = scale
      .scaleLinear()
      .range([height - STROKE_WIDTH, STROKE_WIDTH + FOCUS_RADIUS])
      .domain([0, maxY]);

    const area = shape
      .area()
      .x(d => this.x(d.date))
      .y0(this.y(0))
      .y1(d => this.y(d.value.toNumber()))
      .curve(shape.curveCatmullRom)(data);

    const line = shape
      .line()
      .x(d => this.x(d.date))
      .y(d => this.y(d.value.toNumber()))
      .curve(shape.curveCatmullRom)(data);

    const focusPointY =
      isInteractive && hoveredItem ? this.y(hoveredItem.value.toNumber()) : 0;

    return (
      <View
        style={{ height }}
        onLayout={this.onLayout}
        onStartShouldSetResponder={
          isInteractive ? this.onStartShouldSetResponder : undefined
        }
        onResponderGrant={isInteractive ? this.onResponderGrant : undefined}
        onResponderMove={isInteractive ? this.onResponderMove : undefined}
        onResponderRelease={isInteractive ? this.onResponderRelease : undefined}
      >
        {!!width && (
          <Svg height={height} width={width}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="0" y2={height}>
                <Stop offset="0" stopColor={color} stopOpacity="0.3" />
                <Stop offset="1" stopColor={color} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path d={area} fill="url(#grad)" />
            <Path
              d={line}
              stroke={color}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {barVisible && (
              <Fragment>
                <Line
                  x1={barOffsetX}
                  x2={barOffsetX}
                  y1={focusPointY}
                  y2={height}
                  stroke={rgba(color, 0.2)}
                  strokeWidth={FOCUS_RADIUS}
                />
                <Circle
                  cx={barOffsetX}
                  cy={focusPointY}
                  r={5}
                  stroke={color}
                  strokeWidth={STROKE_WIDTH}
                  fill="white"
                />
              </Fragment>
            )}
          </Svg>
        )}
      </View>
    );
  }
}
