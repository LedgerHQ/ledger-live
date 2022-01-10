import React, { useMemo, useCallback } from "react";
import { useTheme } from "styled-components/native";
import { Flex, GraphTabs, InfiniteLoader } from "@ledgerhq/native-ui";
// import { rangeDataTable } from "@ledgerhq/live-common/lib/market/utils/rangeDataTable";
import * as Animatable from "react-native-animatable";
import Graph from "../../../components/Graph";
import getWindowDimensions from "../../../logic/getWindowDimensions";
import { Item } from "../../../components/Graph/types";

const { width } = getWindowDimensions();

const ranges = Object.keys(rangeDataTable);

export default function MarketGraph({
  setHoverItem,
  chartRequestParams,
  loading,
  loadingChart,
  refreshChart,
  chartData,
}: {
  setHoverItem: (data: Item) => void;
  chartRequestParams: any;
  loading?: boolean;
  loadingChart?: boolean;
  refreshChart: (request: any) => void;
  chartData: Record<string, number[]>;
}) {
  return null;
  /**
  const { colors } = useTheme();

  const isLoading = loading || loadingChart;

  const { range } = chartRequestParams;

  const activeRangeIndex = ranges.indexOf(range);
  const data = useMemo(
    () =>
      chartData?.[range]
        ? chartData[range].map(d => ({
            date: new Date(d[0]),
            value: d[1],
          }))
        : [],
    [chartData, range],
  );

  const setRange = useCallback(
    index => {
      if (isLoading) return;
      const newRange = ranges[index];
      if (range !== newRange) refreshChart({ range: newRange });
    },
    [isLoading, range, refreshChart],
  );

  const mapGraphValue = useCallback(d => d?.value || 0, []);

  return (
    <Flex flexDirection="column" mt={20} p={16}>
      <Flex height={100} alignItems="center" justifyContent="center">
        {data && data.length > 0 ? (
          <Animatable.View animation="fadeIn" duration={400} useNativeDriver>
            <Graph
              isInteractive
              isLoading={loadingChart}
              height={100}
              width={width - 32}
              color={colors.primary.c80}
              data={data}
              mapValue={mapGraphValue}
              onItemHover={setHoverItem}
            />
          </Animatable.View>
        ) : (
          <InfiniteLoader size={32} />
        )}
      </Flex>
      <Flex mt={25}>
        <GraphTabs
          activeIndex={activeRangeIndex}
          onChange={setRange}
          labels={ranges}
        />
      </Flex>
    </Flex>
  );
   */
}
