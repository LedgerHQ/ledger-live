import React, { useMemo } from "react";
import Svg, { Circle, G, Path } from "react-native-svg";
import { arc } from "d3-shape";
import { useTheme } from "styled-components/native";
import { ColorableCurrency, getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { ensureContrast } from "~/colors";
import type { DistributionItem } from "./DistributionCard";

export type ColorableDistributionItem = Omit<DistributionItem, "currency"> & {
  currency: ColorableCurrency;
};

type Props = Readonly<{
  data: Array<ColorableDistributionItem>;
  size: number;
  strokeWidth?: number;
}>;

type Paths = {
  items: { pathData?: string; color: string; id: string }[];
  angle: number;
};

const INNER_RADIUS = 0;
const OUTER_RADIUS = 30;

function RingChart({ data, size, strokeWidth = 3 }: Props) {
  const { colors } = useTheme();

  const paths = useMemo(() => {
    const arcGenerator = arc();

    return data.reduce<Paths>(
      (acc, item) => {
        const increment = item.distribution * 2 * Math.PI;

        const pathData =
          arcGenerator({
            startAngle: acc.angle,
            endAngle: acc.angle + increment,
            innerRadius: INNER_RADIUS,
            outerRadius: OUTER_RADIUS,
          }) ?? undefined;

        const parsedItem = {
          color: ensureContrast(getCurrencyColor(item.currency), colors.background.main),
          pathData,
          id: item.currency.id,
        };

        return {
          items: [...acc.items, parsedItem],
          angle: acc.angle + increment,
        };
      },
      {
        items: [],
        angle: 0,
      },
    );
  }, [data, colors.background.main]);

  return (
    <Svg width={size} height={size} viewBox="0 0 76 76">
      <G transform="translate(38, 38)">
        {paths.items.map(({ pathData, color, id }) => (
          <Path
            key={id}
            stroke={colors.background.main}
            strokeWidth={1.5}
            fill={color}
            d={pathData}
          />
        ))}
        <Circle cx={0} cy={0} r={OUTER_RADIUS - strokeWidth} fill={colors.background.main} />
      </G>
    </Svg>
  );
}

export default React.memo(RingChart);
