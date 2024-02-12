import React, { useMemo, useCallback, memo } from "react";
import { useTheme } from "styled-components/native";
import { Flex, GraphTabs, InfiniteLoader, Transitions } from "@ledgerhq/native-ui";
import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";
import { useTranslation } from "react-i18next";
import { SingleCoinProviderData } from "@ledgerhq/live-common/market/MarketDataProvider";
import Graph from "~/components/Graph";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { Item } from "~/components/Graph/types";

const { width } = getWindowDimensions();

function MarketGraph({
  setHoverItem,
  chartRequestParams,
  loading,
  loadingChart,
  refreshChart,
  chartData,
}: {
  setHoverItem: (_: Item | null | undefined) => void;
  chartRequestParams: SingleCoinProviderData["chartRequestParams"];
  loading?: boolean;
  loadingChart?: boolean;
  refreshChart: (_: { range: string }) => void;
  chartData: Record<string, [number, number][]>;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const ranges = Object.keys(rangeDataTable)
    .filter(key => key !== "1h")
    .map(r => ({ label: t(`market.range.${r}`), value: r }));

  const rangesLabels = ranges.map(({ label }) => label);

  const isLoading = loading || loadingChart;

  const { range } = chartRequestParams;

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

  return (
    <Flex flexDirection="column" mt={20} borderRadius={8}>
      <Flex height={120} alignItems="center" justifyContent="center">
        {data && data.length > 0 ? (
          <Transitions.Fade duration={400} status="entering">
            <Graph
              isInteractive
              height={100}
              width={width}
              color={colors.primary.c80}
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
