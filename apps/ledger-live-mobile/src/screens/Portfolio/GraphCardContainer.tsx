import React, { useCallback } from "react";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { SharedValue } from "react-native-reanimated";
import { Portfolio } from "@ledgerhq/types-live";
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
  const handleTouchEndGraph = useCallback(() => {
    track("chart_clicked", {
      graph: "Portfolio",
      page: screenName,
    });
  }, [screenName]);

  return (
    <>
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
