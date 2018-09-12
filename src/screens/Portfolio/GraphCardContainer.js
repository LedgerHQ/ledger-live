// @flow
import React from "react";
import { View } from "react-native";
import type { Summary } from "../../components/provideSummary";
import GraphCard from "../../components/GraphCard";
import Greetings from "./Greetings";

const GraphCardContainer = ({
  summary,
  onPanResponderStart,
  onPanResponderRelease,
}: {
  summary: Summary,
  onPanResponderStart: () => *,
  onPanResponderRelease: () => *,
}) => (
  <View>
    <Greetings nbAccounts={summary.accounts.length} />
    <GraphCard
      summary={summary}
      useCounterValue
      onPanResponderStart={onPanResponderStart}
      onPanResponderRelease={onPanResponderRelease}
    />
  </View>
);

export default GraphCardContainer;
