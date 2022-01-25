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
  counterValueCurrency,
}: {
  portfolio: Portfolio,
  showGraphCard: boolean,
  counterValueCurrency: Currency,
}) => {
  const currencies = useSelector(currenciesSelector);

  return (
    <>
      {showGraphCard && <Header />}

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
