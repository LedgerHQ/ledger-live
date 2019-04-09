// @flow
import React from "react";
import { View } from "react-native";
import type { Portfolio, Currency } from "@ledgerhq/live-common/lib/types";
import GraphCard from "../../components/GraphCard";
import Header from "./Header";

const GraphCardContainer = ({
  portfolio,
  showGreeting,
  counterValueCurrency,
}: {
  portfolio: Portfolio,
  showGreeting: boolean,
  counterValueCurrency: Currency,
}) => (
  <View>
    <Header
      nbAccounts={portfolio.accounts.length}
      showGreeting={showGreeting}
    />
    {showGreeting && (
      <GraphCard
        counterValueCurrency={counterValueCurrency}
        portfolio={portfolio}
      />
    )}
  </View>
);

export default GraphCardContainer;
