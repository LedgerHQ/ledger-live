// @flow
import React from "react";
import { View } from "react-native";
import type { Summary } from "../../components/provideSummary";
import GraphCard from "../../components/GraphCard";
import Greetings from "./Greetings";

const GraphCardContainer = ({ summary }: { summary: Summary }) => (
  <View>
    <Greetings nbAccounts={summary.accounts.length} />
    <GraphCard summary={summary} useCounterValue />
  </View>
);

export default GraphCardContainer;
