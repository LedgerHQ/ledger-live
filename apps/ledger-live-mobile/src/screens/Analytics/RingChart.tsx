// @flow

import React, { PureComponent } from "react";
import * as d3shape from "d3-shape";
import { View } from "react-native";
import Svg, { Path, G, Circle } from "react-native-svg";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import type { DistributionItem } from "./DistributionCard";
import { ensureContrast, withTheme } from "../../colors";

type Props = {
  data: Array<DistributionItem>,
  size: number,
  colors: any,
};

class RingChart extends PureComponent<Props> {
  arcGenerator = d3shape.arc();
  offsetX = 0;
  offsetY = 0;
  paths: any = {};

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

  reducer = (data: any, item: DistributionItem, index: number) => {
    const increment = item.distribution * 2 * Math.PI;
    const innerRadius = 0;

    const pathData = this.arcGenerator({
      startAngle: data.angle,
      endAngle: data.angle + increment,
      innerRadius,
      outerRadius: 30,
    });

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
    const { size, colors } = this.props;

    return (
      <View>
        <Svg width={size} height={size} viewBox="0 0 76 76">
          <G transform="translate(38, 38)">
            {(this.paths.items || []).map(({ pathData, color, id }, i) => (
              <Path
                key={id}
                stroke={colors.background.main}
                strokeWidth={1.5}
                fill={color}
                d={pathData}
              />
            ))}
            <Circle cx={0} cy={0} r="27" fill={colors.background.main} />
          </G>
        </Svg>
      </View>
    );
  }
}

export default withTheme(RingChart);
