import { useMemo } from "react";
import { arc } from "d3-shape";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { ensureContrast } from "~/colors";
import type { ColorableDistributionItem } from "./types";

type Paths = {
  items: { pathData?: string; color: string; id: string }[];
  angle: number;
};

const INNER_RADIUS = 0;
const OUTER_RADIUS = 30;

export function useRingChartViewModel(data: Array<ColorableDistributionItem>, strokeWidth: number) {
  const { theme } = useTheme();
  const canvasColor = theme.colors.bg.canvas;

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
          color: ensureContrast(getCurrencyColor(item.currency), canvasColor),
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
  }, [data, canvasColor]);

  const innerCircleRadius = OUTER_RADIUS - strokeWidth;

  return { paths, canvasColor, innerCircleRadius };
}
