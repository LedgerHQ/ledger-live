// @flow
import React from "react";
import { View } from "react-native";
import type { Summary } from "../../components/provideSummary";
import GraphCard from "../../components/GraphCard";
import Header from "./Header";

const GraphCardContainer = ({
  summary,
  showGreeting,
}: {
  summary: Summary,
  showGreeting: boolean,
}) => (
  <View>
    <Header nbAccounts={summary.accounts.length} showGreeting={showGreeting} />
    {showGreeting && <GraphCard summary={summary} useCounterValue />}
  </View>
);

export default GraphCardContainer;
