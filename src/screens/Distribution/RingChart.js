// @flow

import React, { PureComponent } from "react";
import { View } from "react-native";
import * as d3shape from "d3-shape";
import Svg, { Path, G } from "react-native-svg";
import colors from "../../colors";
import type { DistributionItem } from "./DistributionCard";

type Props = {
  data: *,
  style?: *,
};

class RingChart extends PureComponent<Props> {
  static defaultProps = {
    data: [],
  };
  arcGenerator = d3shape.arc();
  reducer = (data: *, item: DistributionItem) => {
    const increment = item.distribution * 2 * Math.PI;

    const pathData = this.arcGenerator({
      startAngle: data.angle,
      endAngle: data.angle + increment,
      innerRadius: 45,
      outerRadius: 50,
    });

    const parsedItem = {
      // $FlowFixMe
      color: item.currency.color || colors.live,
      pathData,
      id: item.currency.id,
    };

    return {
      items: [...data.items, parsedItem],
      angle: data.angle + increment,
    };
  };

  render() {
    const { data, style } = this.props;
    const paths = data.reduce(this.reducer, { items: [], angle: 0 });

    return (
      <View style={style}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <G transform="translate(50, 50)">
            {paths.items.map(({ pathData, color, id }) => (
              <Path
                key={id}
                stroke={colors.white}
                strokeWidth={0.5}
                fill={color}
                d={pathData}
              />
            ))}
          </G>
        </Svg>
      </View>
    );
  }
}

export default RingChart;
