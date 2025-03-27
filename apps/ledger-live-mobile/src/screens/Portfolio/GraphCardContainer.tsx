import React from "react";
import { useSelector } from "react-redux";
import { Currency, TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import Animated from "react-native-reanimated";
import { Portfolio } from "@ledgerhq/types-live";
import { currenciesSelector } from "~/reducers/accounts";
import CurrencyDownStatusAlert from "~/components/CurrencyDownStatusAlert";
import GraphCard from "~/components/GraphCard";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { track } from "~/analytics";

const GraphCardContainer = ({
  portfolio,
  showGraphCard,
  areAccountsEmpty,
  counterValueCurrency,
  currentPositionY,
  graphCardEndPosition,
}: {
  portfolio: Portfolio;
  showGraphCard: boolean;
  areAccountsEmpty: boolean;
  counterValueCurrency: Currency;
  currentPositionY: Animated.SharedValue<number>;
  graphCardEndPosition: number;
}) => {
  const currencies: Array<CryptoCurrency | TokenCurrency> = useSelector(currenciesSelector);

  const handleTouchEndGraph = () => {
    track("chart_clicked", {
      graph: "Portfolio",
      page: "Wallet",
    });
  };

  return (
    <>
      <CurrencyDownStatusAlert currencies={currencies} />

      {showGraphCard && (
        <GraphCard
          areAccountsEmpty={areAccountsEmpty}
          counterValueCurrency={counterValueCurrency}
          portfolio={portfolio}
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
          onTouchEndGraph={handleTouchEndGraph}
        />
      )}
    </>
  );
};

export default withDiscreetMode(GraphCardContainer);
