// @flow

// TODO
// - render something else for non countervalues available case

import React, { memo } from "react";
import * as d3shape from "d3-shape";
import * as d3scale from "d3-scale";
import maxBy from "lodash/maxBy";
import minBy from "lodash/minBy";
import Svg, { Path, Defs, Text } from "react-native-svg";
import { useTheme } from "styled-components/native";
import DefGraph from "./DefGrad";
import BarInteraction from "./BarInteraction";
import type { Item, ItemArray } from "./types";

type Props = {
  width: number,
  height: number,
  data?: ItemArray,
  color: string,
  isInteractive: boolean,
  onItemHover?: (?Item) => void,
  mapValue: Item => number,
  shape?: string,
  verticalRangeRatio?: number,
  showMinMax?: boolean,
};

const STROKE_WIDTH = 2;
const FOCUS_RADIUS = 4;

function Graph({
  width,
  height,
  data = [],
  color: initialColor,
  isInteractive = false,
  shape = "curveMonotoneX",
  mapValue,
  onItemHover,
  verticalRangeRatio = 2,
  showMinMax = false,
}: Props) {
  const { colors } = useTheme();

  const color = initialColor || colors.primary.c80;

  const maxY = mapValue(maxBy(data, mapValue));
  const roundedMaxY =
    Math.round((maxY + Number.EPSILON) * 100000000) / 100000000;
  const minY = mapValue(minBy(data, mapValue));
  const roundedMinY =
    Math.round((minY + Number.EPSILON) * 100000000) / 100000000;
  const paddedMinY = minY - (maxY - minY) / verticalRangeRatio;

  const yExtractor = d => y(mapValue(d));

  const curve = d3shape[shape];
  const x = d3scale
    .scaleTime()
    .range([0, width])
    .domain([data[0].date, data[data.length - 1].date]);

  const y = d3scale
    .scaleLinear()
    .domain([paddedMinY, maxY])
    .range([height - STROKE_WIDTH, STROKE_WIDTH + FOCUS_RADIUS]);

  const area = d3shape
    .area()
    .x(d => x(d.date))
    .y0(d => yExtractor(d))
    .y1(d => yExtractor(d) + Math.max((maxY - minY) / verticalRangeRatio, 200))
    .curve(curve)(data);

  const line = d3shape
    .line()
    .x(d => x(d.date))
    .y(yExtractor)
    .curve(curve)(data);

  const grads = Array(5)
    .fill(true)
    .map((_, i) => (height / 4) * i);

  const content = (
    <Svg
      height={height}
      width={width}
      viewBox={`0 -10 ${width} ${height + 20}`}
      preserveAspectRatio="none"
    >
      <Defs>
        <DefGraph height={height} color={color} />
      </Defs>
      <Path d={area} fill="url(#grad)" />

      {grads.map(h => (
        <Path
          key={`${h}`}
          d={`M0,${h} H${width}`}
          stroke={colors.constant.overlay}
          strokeDasharray="1 5"
          strokeWidth={1}
          fill="none"
        />
      ))}
      <Path d={line} stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
      {showMinMax ? (
        <>
          <Text x={16} y={0} fontSize="10px" fill={colors.neutral.c60}>
            max: {roundedMaxY}
          </Text>
          <Text x={16} y={height} fontSize="10px" fill={colors.neutral.c60}>
            min: {roundedMinY}
          </Text>
        </>
      ) : null}
    </Svg>
  );

  return isInteractive ? (
    <BarInteraction
      width={width}
      height={height}
      data={data}
      color={color}
      mapValue={mapValue}
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

export default memo<Props>(Graph);
