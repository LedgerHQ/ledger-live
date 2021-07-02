// @flow
import React from "react";
import { useSelector } from "react-redux";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import type { Portfolio } from "@ledgerhq/live-common/lib/portfolio/v2/types";
import { currenciesSelector } from "../../reducers/accounts";
import CurrencyDownStatusAlert from "../../components/CurrencyDownStatusAlert";
import GraphCard from "../../components/GraphCard";
import Header from "./Header";

const GraphCardContainer = ({
  portfolio,
  showGraphCard,
  showGreeting,
  counterValueCurrency,
}: {
  portfolio: Portfolio,
  showGreeting: boolean,
  showGraphCard: boolean,
  counterValueCurrency: Currency,
}) => {
  const currencies = useSelector(currenciesSelector);

  const showDistribution =
    portfolio.balanceHistory[portfolio.balanceHistory.length - 1].value > 0;

  return (
    <>
      {showGraphCard && (
        <Header
          nbAccounts={portfolio.accounts.length}
          showGreeting={showGreeting}
          showDistribution={showDistribution}
        />
      )}

      <CurrencyDownStatusAlert currencies={currencies} />

      {showGraphCard && (
        <GraphCard
          counterValueCurrency={counterValueCurrency}
          portfolio={portfolio}
        />
      )}
    </>
  );
};

export default GraphCardContainer;
