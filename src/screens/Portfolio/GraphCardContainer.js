// @flow
import React from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import type { Portfolio, Currency } from "@ledgerhq/live-common/lib/types";
import { currenciesSelector } from "../../reducers/accounts";
import CurrencyDownStatusAlert from "../../components/CurrencyDownStatusAlert";
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
}) => {
  const currencies = useSelector(currenciesSelector);

  const showDistribution = portfolio.balanceHistory[
    portfolio.balanceHistory.length - 1
  ].value.gt(0);
  return (
    <View>
      <Header
        nbAccounts={portfolio.accounts.length}
        showGreeting={showGreeting}
        showDistribution={showDistribution}
      />

      <CurrencyDownStatusAlert currencies={currencies} />

      {showGreeting && (
        <GraphCard
          counterValueCurrency={counterValueCurrency}
          portfolio={portfolio}
        />
      )}
    </View>
  );
};

export default GraphCardContainer;
