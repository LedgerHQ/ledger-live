// @flow

// TODO
// - render something else for non countervalues available case

import React, { PureComponent } from "react";
import * as shape from "d3-shape";
import * as scale from "d3-scale";
import { BigNumber } from "bignumber.js";
import maxBy from "lodash/maxBy";
import Svg, { Path, Defs } from "react-native-svg";

import colors from "../../colors";
import DefGraph from "./DefGrad";
import BarInteraction from "./BarInteraction";

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
  onItemHover?: (?Item) => void,
};

const STROKE_WIDTH = 2;
const FOCUS_RADIUS = 4;

export default class Graph extends PureComponent<Props> {
  static defaultProps = {
    data: [],
    color: colors.live,
    isInteractive: false,
    useCounterValue: false,
  };

  render() {
    const {
      width,
      height,
      data,
      color,
      isInteractive,
      useCounterValue,
      onItemHover,
    } = this.props;

    const maxY = useCounterValue
      ? maxBy(data, d => d.value.toNumber()).value.toNumber()
      : maxBy(data, d => d.originalValue.toNumber()).originalValue.toNumber();

    const yExtractor = useCounterValue
      ? d => y(d.value.toNumber())
      : d => y(d.originalValue.toNumber());

    const curve = useCounterValue ? shape.curveLinear : shape.curveStepBefore;

    const x = scale
      .scaleTime()
      .range([0, width])
      .domain([data[0].date, data[data.length - 1].date]);

    const y = scale
      .scaleLinear()
      .range([height - STROKE_WIDTH, STROKE_WIDTH + FOCUS_RADIUS])
      .domain([0, maxY]);

    const area = shape
      .area()
      .x(d => x(d.date))
      .y0(y(0))
      .y1(yExtractor)
      .curve(curve)(data);

    const line = shape
      .line()
      .x(d => x(d.date))
      .y(yExtractor)
      .curve(curve)(data);

    const content = (
      <Svg height={height} width={width}>
        <Defs>
          <DefGraph height={height} color={color} />
        </Defs>
        <Path d={area} fill="url(#grad)" />
        <Path d={line} stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
      </Svg>
    );

    return isInteractive ? (
      <BarInteraction
        width={width}
        height={height}
        data={data}
        color={color}
        useCounterValue={useCounterValue}
        onItemHover={onItemHover}
        x={x}
        y={y}
      >
        {content}
      </BarInteraction>
    ) : (
      content
    );
  }
}
