/* eslint-disable import/no-named-as-default */
/* eslint-disable import/no-named-as-default-member */
import React, { useMemo, useCallback, memo } from "react";
import { useTheme } from "styled-components/native";
import {
  Flex,
  GraphTabs,
  InfiniteLoader,
  Transitions,
} from "@ledgerhq/native-ui";
import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";
import * as Animatable from "react-native-animatable";
import { useTranslation } from "react-i18next";
import Graph from "../../../components/Graph";
// @ts-expect-error impot issue
import getWindowDimensions from "../../../logic/getWindowDimensions";
import { Transition } from "@ledgerhq/native-ui/components/transitions";

const { width } = getWindowDimensions();

function MarketGraph({
  setHoverItem,
  chartRequestParams,
  loading,
  loadingChart,
  refreshChart,
  chartData,
}: {
  setHoverItem: (data: any) => void;
  chartRequestParams: any;
  loading?: boolean;
  loadingChart?: boolean;
  refreshChart: (request: any) => void;
  chartData: Record<string, number[]>;
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
      chartData?.[range]
        ? chartData[range].map(d => ({
            date: new Date(d[0]),
            value: d[1] || 0,
          }))
        : [],
    [chartData, range],
  );

  const setRange = useCallback(
    index => {
      if (isLoading) return;
      const newRange = ranges[index]?.value;
      if (range !== newRange) refreshChart({ range: newRange });
    },
    [isLoading, range, ranges, refreshChart],
  );

  const mapGraphValue = useCallback(d => d?.value || 0, []);

  return (
    <Flex flexDirection="column" mt={20} borderRadius={8}>
      <Flex height={120} alignItems="center" justifyContent="center">
        {data && data.length > 0 ? (
          <Transitions.Fade duration={400} status="entering">
            {/** @ts-expect-error import js issue */}
            <Graph
              isInteractive
              isLoading={loadingChart}
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
