import React, { useCallback, useMemo } from "react";
import { ensureContrast } from "@ledgerhq/native-ui";
import { Item } from "~/components/Graph/types";
import Graph from "~/components/Graph";
import { KeysPriceChange, MarketCoinDataChart } from "@ledgerhq/live-common/market/utils/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTheme } from "styled-components/native";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { LoadingIndicator } from "./Loading";

type GraphProps = {
  chartData?: MarketCoinDataChart;
  currency: CryptoOrTokenCurrency;
  width: number;
  loading: boolean;
  range: KeysPriceChange;
};

export const LargeMoverGraph: React.FC<GraphProps> = ({
  chartData,
  currency,
  width,
  loading,
  range,
}) => {
  const theme = useTheme();

  const data = useMemo(
    () =>
      !loading && range && chartData?.[range]
        ? chartData[range].map(d => ({
            date: new Date(d[0]),
            value: d[1] || 0,
          }))
        : [],
    [chartData, loading, range],
  );

  const mapGraphValue = useCallback((d: Item) => d?.value ?? 0, []);

  const graphColor = useMemo(
    () =>
      !currency
        ? theme.colors.primary.c80
        : ensureContrast(getCurrencyColor(currency), theme.colors.background.main),
    [theme.colors.background.main, theme.colors.primary.c80, currency],
  );

  if (loading || !data.length) {
    return <LoadingIndicator height={150} />;
  }
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
