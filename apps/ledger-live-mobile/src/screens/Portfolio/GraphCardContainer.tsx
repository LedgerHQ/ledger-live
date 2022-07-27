import React from "react";
import { useSelector } from "react-redux";
import { currenciesSelector } from "../../reducers/accounts";
import CurrencyDownStatusAlert from "../../components/CurrencyDownStatusAlert";
import GraphCard from "../../components/GraphCard";
import { withDiscreetMode } from "../../context/DiscreetModeContext";

const GraphCardContainer = ({
  portfolio,
  showGraphCard,
  areAccountsEmpty,
  counterValueCurrency,
}: {
  portfolio: Portfolio;
  showGraphCard: boolean;
  areAccountsEmpty: boolean;
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
          areAccountsEmpty={areAccountsEmpty}
          counterValueCurrency={counterValueCurrency}
          portfolio={portfolio}
        />
      )}
    </>
  );
};

export default withDiscreetMode(GraphCardContainer);
