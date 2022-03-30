// @flow
import React from "react";
import { useSelector } from "react-redux";
import {
  Currency,
  TokenCurrency,
  CryptoCurrency,
} from "@ledgerhq/live-common/lib/types";
import { Portfolio } from "@ledgerhq/live-common/lib/portfolio/v2/types";
import { currenciesSelector } from "../../reducers/accounts";
import CurrencyDownStatusAlert from "../../components/CurrencyDownStatusAlert";
import GraphCard from "../../components/GraphCard";
import { withDiscreetMode } from "../../context/DiscreetModeContext";

const GraphCardContainer = ({
  portfolio,
  showGraphCard,
  counterValueCurrency,
}: {
  portfolio: Portfolio;
  showGraphCard: boolean;
  counterValueCurrency: Currency;
}) => {
  const currencies: Array<CryptoCurrency | TokenCurrency> = useSelector(
    currenciesSelector,
  );

  return (
    <>
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

export default withDiscreetMode(GraphCardContainer);
