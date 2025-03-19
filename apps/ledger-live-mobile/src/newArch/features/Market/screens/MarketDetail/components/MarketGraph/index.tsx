import React, { useMemo, useCallback, memo } from "react";
import { useTheme } from "styled-components/native";
import { Flex, GraphTabs, InfiniteLoader, Transitions, ensureContrast } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import Graph from "~/components/Graph";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { Item } from "~/components/Graph/types";
import { RANGES } from "LLM/features/Market/utils";
import { MarketCoinDataChart } from "@ledgerhq/live-common/market/utils/types";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
// eslint-disable-next-line no-restricted-imports
import { rangeDataTable } from "@ledgerhq/live-common/lib/market/utils/rangeDataTable";

const { width } = getWindowDimensions();

function MarketGraph({
  setHoverItem,
  isLoading,
  refreshChart,
  chartData,
  range,
  currency,
}: {
  setHoverItem: (_: Item | null | undefined) => void;
  isLoading?: boolean;
  refreshChart: (_: { range: string }) => void;
  chartData?: MarketCoinDataChart;
  range: string;
  currency?: CryptoOrTokenCurrency;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const ranges = RANGES.map(r => ({
    label: t(`market.range.${rangeDataTable[r].label}`),
    value: r,
  })).reverse();

  const rangesLabels = ranges.map(({ label }) => label);

  const activeRangeIndex = ranges.findIndex(r => r.value === range);
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

  const setRange = useCallback(
    (index: number) => {
      if (isLoading) return;
      const newRange = ranges[index]?.value;
      if (range !== newRange) refreshChart({ range: newRange });
    },
    [isLoading, range, ranges, refreshChart],
  );

  const mapGraphValue = useCallback((d: Item) => d?.value || 0, []);

  const graphColor = useMemo(
    () =>
      !currency
        ? colors.primary.c80
        : ensureContrast(getCurrencyColor(currency), colors.background.main),
    [colors.background.main, colors.primary.c80, currency],
  );

  return (
    <Flex flexDirection="column" mt={20} borderRadius={8}>
      <Flex height={120} alignItems="center" justifyContent="center">
        {data && data.length > 0 ? (
          <Transitions.Fade duration={400} status="entering">
            <Graph
              isInteractive
              height={100}
              width={width}
              color={graphColor}
              data={data}
              mapValue={mapGraphValue}
              onItemHover={setHoverItem}
              verticalRangeRatio={10}
            />
          </Transitions.Fade>
        ) : (
          <InfiniteLoader size={32} />
        )}
      </Flex>

      <Flex mt={25} mx={6}>
        <GraphTabs
          activeIndex={activeRangeIndex}
          activeBg="neutral.c30"
          onChange={setRange}
          labels={rangesLabels}
        />
      </Flex>
    </Flex>
  );
}

export default memo(MarketGraph);
