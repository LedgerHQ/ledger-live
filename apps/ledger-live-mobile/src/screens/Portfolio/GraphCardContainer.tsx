import React, { useCallback } from "react";
import { useSelector } from "~/context/hooks";
import { Currency, TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { SharedValue } from "react-native-reanimated";
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
  screenName,
  hideGraph,
}: {
  portfolio: Portfolio;
  showGraphCard: boolean;
  areAccountsEmpty: boolean;
  counterValueCurrency: Currency;
  currentPositionY: SharedValue<number>;
  graphCardEndPosition: number;
  screenName: string;
  hideGraph?: boolean;
}) => {
  const currencies: Array<CryptoCurrency | TokenCurrency> = useSelector(currenciesSelector);

  const handleTouchEndGraph = useCallback(() => {
    track("chart_clicked", {
      graph: "Portfolio",
      page: screenName,
    });
  }, [screenName]);

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
          hideGraph={hideGraph}
        />
      )}
    </>
  );
};

export default withDiscreetMode(GraphCardContainer);
