import React, { PureComponent } from "react";
import * as d3shape from "d3-shape";
import { View } from "react-native";
import Svg, { Path, G, Circle } from "react-native-svg";
import {
  getCurrencyColor,
  ColorableCurrency,
} from "@ledgerhq/live-common/currencies/index";
import { DefaultTheme } from "styled-components/native";
import type { DistributionItem } from "./DistributionCard";
import { ensureContrast, withTheme } from "../../colors";

/**
 * Type that allows to have a dynamically generated currency "other" that just
 * has a color and a ticker.
 */
export type ColorableDistributionItem = Omit<DistributionItem, "currency"> & {
  currency: ColorableCurrency;
};

type Props = {
  data: Array<ColorableDistributionItem>;
  size: number;
  strokeWidth?: number;
  colors: DefaultTheme["colors"];
};

type Paths = {
  items: { pathData?: string; color: string; id: string }[];
  angle: number;
};

class RingChart extends PureComponent<Props> {
  arcGenerator = d3shape.arc();
  offsetX = 0;
  offsetY = 0;
  paths: Paths | null = null;
  innerRadius = 0;
  outerRadius = 30;

  constructor(props: Props) {
    super(props);
    this.generatePaths();
  }

  generatePaths = () => {
    const { data } = this.props;
    this.paths = data.reduce(this.reducer, {
      items: [],
      angle: 0,
    });
  };

  componentDidUpdate() {
    this.generatePaths();
  }

  reducer = (
    data: Paths,
    item: ColorableDistributionItem,
    index: number,
  ): Paths => {
    const increment = item.distribution * 2 * Math.PI;

    const pathData =
      this.arcGenerator({
        startAngle: data.angle,
        endAngle: data.angle + increment,
        innerRadius: this.innerRadius,
        outerRadius: this.outerRadius,
      }) ?? undefined;

    const parsedItem = {
      color: ensureContrast(
        getCurrencyColor(item.currency),
        this.props.colors.background.main,
      ),
      pathData,
      endAngle: data.angle + increment,
      id: item.currency.id,
      index,
    };

    return {
      items: [...data.items, parsedItem],
      angle: data.angle + increment,
    };
  };

  render() {
    const { size, colors, strokeWidth } = this.props;

    return (
      <View>
        <Svg width={size} height={size} viewBox="0 0 76 76">
          <G transform="translate(38, 38)">
            {(this.paths?.items || []).map(({ pathData, color, id }) => (
              <Path
                key={id}
                stroke={colors.background.main}
                strokeWidth={1.5}
                fill={color}
                d={pathData}
              />
            ))}
            <Circle
              cx={0}
              cy={0}
              r={this.outerRadius - (strokeWidth || 3)}
              fill={colors.background.main}
            />
          </G>
        </Svg>
      </View>
    );
  }
}

export default withTheme(RingChart);
