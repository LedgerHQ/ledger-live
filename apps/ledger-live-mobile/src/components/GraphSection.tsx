import React from "react";
import { Flex, GraphTabs } from "@ledgerhq/native-ui";
import { Portfolio } from "@ledgerhq/types-live";
import { GestureResponderEvent } from "react-native";
import getWindowDimensions from "~/logic/getWindowDimensions";
import Graph from "./Graph";
import EmptyGraph from "~/icons/EmptyGraph";
import { Item } from "./Graph/types";

const { width } = getWindowDimensions();

interface GraphSectionProps {
  readonly readOnlyModeEnabled: boolean;
  readonly onTouchEndGraph?: (event: GestureResponderEvent) => void;
  readonly isAvailable: boolean;
  readonly balanceHistory: Portfolio["balanceHistory"];
  readonly onItemHover: (item?: Item | null) => void;
  readonly mapGraphValue: (d: Item) => number;
  readonly primaryColor: string;
  readonly activeRangeIndex: number;
  readonly updateTimeRange: (index: number) => void;
  readonly rangesLabels: string[];
}

const GraphSection = ({
  readOnlyModeEnabled,
  onTouchEndGraph,
  isAvailable,
  balanceHistory,
  onItemHover,
  mapGraphValue,
  primaryColor,
  activeRangeIndex,
  updateTimeRange,
  rangesLabels,
}: GraphSectionProps) => {
  if (readOnlyModeEnabled) return <EmptyGraph />;

  return (
    <>
      <Flex onTouchEnd={onTouchEndGraph}>
        <Graph
          isInteractive={isAvailable}
          height={110}
          width={width + 1}
          color={primaryColor}
          data={balanceHistory}
          onItemHover={onItemHover}
          mapValue={mapGraphValue}
          fill="transparent"
          testID="graphCard-chart"
        />
      </Flex>
      <Flex paddingTop={6} background="transparent">
        <GraphTabs
          activeIndex={activeRangeIndex}
          onChange={updateTimeRange}
          labels={rangesLabels}
        />
      </Flex>
    </>
  );
};

export default GraphSection;
