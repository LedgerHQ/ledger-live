import React, { useMemo } from "react";
import Chart from "~/renderer/components/Chart";
import { useTheme } from "styled-components";
import { Data, Item } from "./Chart/types";
import { PortfolioRange } from "@ledgerhq/types-live";

type Props = {
  data: Data;
  tickXScale: PortfolioRange;
  magnitude: number;
};

const PlaceholderChart = ({ data, tickXScale, magnitude }: Props) => {
  const theme = useTheme();
  const themeType = theme.theme;
  const mappedData: Data = useMemo(
    () =>
      data.map((i: Item) => {
        const date = i.date.getTime();
        return {
          ...i,
          // general curve trend
          value:
            10000 *
            (1 +
              0.1 * Math.sin(date * Math.cos(date)) +
              // random-ish
              0.5 * Math.cos(date / 2000000000 + Math.sin(date / 1000000000))),
        };
      }),
    [data],
  );
  return (
    <Chart
      color={themeType === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}
      data={mappedData}
      height={200}
      tickXScale={tickXScale}
      renderTickY={() => ""}
      magnitude={magnitude}
    />
  );
};

export default React.memo(PlaceholderChart, (prevProps, nextProps) => {
  return prevProps.tickXScale === nextProps.tickXScale;
});
