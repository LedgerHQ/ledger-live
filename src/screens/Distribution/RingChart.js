// @flow

import React, { PureComponent } from "react";
import { PanResponder, View } from "react-native";
import type { PressEvent } from "react-native/Libraries/Types/CoreEventTypes";
import * as d3shape from "d3-shape";
import Svg, { Path, G, Circle } from "react-native-svg";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";
import type { DistributionItem } from "./DistributionCard";
import { ensureContrast, withTheme } from "../../colors";

type Props = {
  data: Array<DistributionItem>,
  size: number,
  onHighlightChange: number => void,
  highlight: number,
  bg: string,
  colors: *,
};

class RingChart extends PureComponent<Props> {
  static defaultProps = {
    highlight: -1,
  };

  panResponder: *;
  arcGenerator = d3shape.arc();
  offsetX = 0;
  offsetY = 0;
  paths: * = {};

  constructor(props: Props) {
    super(props);
    this.panResponder = PanResponder.create({
      onPanResponderGrant: event => {
        this.offsetX = event.nativeEvent.pageX - event.nativeEvent.locationX;
        this.offsetY = event.nativeEvent.pageY - event.nativeEvent.locationY;
        this.findHighlightedArc(event);
      },
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderMove: this.findHighlightedArc,

      onShouldBlockNativeResponder: () => false,
    });
    this.generatePaths();
  }

  findHighlightedArc = (event: PressEvent) => {
    const { size, onHighlightChange } = this.props;
    const x = event.nativeEvent.pageX - this.offsetX;
    const y = event.nativeEvent.pageY - this.offsetY;

    const y0 = size / 2;
    const x0 = size / 2;
    let rad = Math.atan2(y - y0, x - x0);
    rad = (2.5 * Math.PI + rad) % (2 * Math.PI);

    let highlight = this.props.highlight;
    for (let i = 0; i < this.paths.items.length; i++) {
      if (this.paths.items[i].endAngle > rad) {
        highlight = i;
        break;
      }
    }

    if (highlight !== this.props.highlight) {
      onHighlightChange(highlight);
    }
  };

  generatePaths = () => {
    const { data } = this.props;
    this.paths = data.reduce(this.reducer, {
      items: [],
      highlightedItems: [],
      angle: 0,
    });
  };

  componentDidUpdate() {
    this.generatePaths();
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
      color: ensureContrast(
        getCurrencyColor(item.currency),
        this.props.colors.background,
      ),
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
    const { highlight, size, bg, colors } = this.props;
    return (
      <View {...this.panResponder.panHandlers}>
        <Svg width={size} height={size} viewBox="0 0 76 76">
          <G transform="translate(38, 38)">
            {this.paths.items.map(({ pathData, color, id }, i) => (
              <Path
                key={id}
                stroke={colors.card}
                strokeWidth={0.5}
                fill={color}
                d={
                  i === highlight
                    ? this.paths.highlightedItems[i].pathData
                    : pathData
                }
              />
            ))}
            <Circle cx={0} cy={0} r="26" fill={bg} />
          </G>
        </Svg>
      </View>
    );
  }
}

export default withTheme(RingChart);
