import React, { useCallback, useMemo } from "react";
import { ensureContrast } from "@ledgerhq/native-ui";
import { Item } from "~/components/Graph/types";
import Graph from "~/components/Graph";
import { MarketCoinDataChart } from "@ledgerhq/live-common/market/utils/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTheme } from "styled-components/native";
import { getCryptoCurrencyById, getCurrencyColor } from "@ledgerhq/live-common/currencies/index";

type GraphProps = {
  chartData: MarketCoinDataChart;
  range: "24h" | "7d" | "1m" | "1y";
  currencyId: string;
  width: number;
};

export const LargeMoverGraph: React.FC<GraphProps> = ({ chartData, range, currencyId, width }) => {
  const theme = useTheme();
  const currency: CryptoOrTokenCurrency | undefined = getCryptoCurrencyById(currencyId);

  const data = useMemo(
    () =>
      range && chartData?.[range]
        ? chartData[range].map(d => ({
            date: new Date(d[0]),
            value: d[1] || 0,
          }))
        : [],
    [chartData, range],
  );

  const mapGraphValue = useCallback((d: Item) => d?.value || 0, []);

  const graphColor = useMemo(
    () =>
      !currency
        ? theme.colors.primary.c80
        : ensureContrast(getCurrencyColor(currency), theme.colors.background.main),
    [theme.colors.background.main, theme.colors.primary.c80, currency],
  );
  return (
    <Graph
      testID="large-mover-graph"
      width={width}
      height={150}
      color={graphColor}
      isInteractive={false}
      mapValue={mapGraphValue}
      data={data}
    />
  );
};
