// @flow

import React, { PureComponent } from "react";
import { PanResponder, View } from "react-native";
import * as d3shape from "d3-shape";
import Svg, { Path, G, Circle } from "react-native-svg";
import colors from "../../colors";
import type { DistributionItem } from "./DistributionCard";

type Props = {
  data: Array<DistributionItem>,
  side: number,
  style?: *,
  selectedKey: number => void,
  highlight?: number,
};

class RingChart extends PureComponent<Props> {
  static defaultProps = {
    data: [],
  };

  panResponder: *;
  arcGenerator = d3shape.arc();
  offsetX = 0;
  offsetY = 0;
  highlight = -1;
  paths: * = {};

  constructor(props: Props) {
    super(props);
    const { highlight, side, selectedKey, data } = this.props;

    if (highlight) {
      this.highlight = highlight;
    }

    this.panResponder = PanResponder.create({
      onPanResponderGrant: event => {
        this.offsetX = event.nativeEvent.pageX - event.nativeEvent.locationX;
        this.offsetY = event.nativeEvent.pageY - event.nativeEvent.locationY;
      },
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => false,

      onPanResponderMove: event => {
        const x = event.nativeEvent.pageX - this.offsetX;
        const y = event.nativeEvent.pageY - this.offsetY;

        const y0 = side / 2;
        const x0 = side / 2;
        let rad = Math.atan2(y - y0, x - x0);
        rad =
          ((rad > 0 ? rad : 2 * Math.PI + rad) + 1.5707963268) % (2 * Math.PI);

        let highlight = this.highlight;
        for (let i = 0; i < this.paths.items.length; i++) {
          if (this.paths.items[i].endAngle > rad) {
            highlight = i;
            break;
          }
        }
        if (this.highlight !== highlight) {
          selectedKey(highlight);
        }
      },

      onShouldBlockNativeResponder: () => false,
    });
    this.paths = data.reduce(this.reducer, {
      items: [],
      highlightedItems: [],
      angle: 0,
    });
  }

  reducer = (data: *, item: DistributionItem, index: number) => {
    const increment = item.distribution * 2 * Math.PI;
    const innerRadius = 0;

    const pathData = this.arcGenerator({
      startAngle: data.angle,
      endAngle: data.angle + increment,
      innerRadius,
      outerRadius: 32,
    });

    const highlightPathData = this.arcGenerator({
      startAngle: data.angle,
      endAngle: data.angle + increment,
      innerRadius,
      outerRadius: 36,
    });

    const parsedItem = {
      // $FlowFixMe
      color: item.currency.color || colors.live,
      pathData,
      endAngle: data.angle + increment,
      id: item.currency.id,
      index,
    };

    const parsedItemHighlight = { ...parsedItem, pathData: highlightPathData };

    return {
      items: [...data.items, parsedItem],
      highlightedItems: [...data.highlightedItems, parsedItemHighlight],
      angle: data.angle + increment,
    };
  };

  render() {
    const { style, highlight } = this.props;
    return (
      <View style={style} {...this.panResponder.panHandlers}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <G transform="translate(50, 50)">
            {this.paths &&
              this.paths.items.map(({ pathData, color, id }, i) => (
                <Path
                  key={id}
                  stroke={colors.white}
                  strokeWidth={0.5}
                  fill={color}
                  d={
                    i === highlight
                      ? this.paths.highlightedItems[i].pathData
                      : pathData
                  }
                />
              ))}
            <Circle cx={0} cy={0} r="26" fill="#fff" />
          </G>
        </Svg>
      </View>
    );
  }
}

export default RingChart;
