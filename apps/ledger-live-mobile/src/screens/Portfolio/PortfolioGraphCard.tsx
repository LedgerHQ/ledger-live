import React, { useCallback, useState } from "react";
import { Box } from "@ledgerhq/native-ui";
import { LayoutChangeEvent } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSelector } from "react-redux";
import { usePortfolioAllAccounts } from "~/hooks/portfolio";
import { areAccountsEmptySelector } from "~/reducers/accounts";
import useCounterValueCurrency from "~/hooks/useCounterValueCurrency";
import GraphCardContainer from "./GraphCardContainer";

type Props = {
  showAssets: boolean;
};

const PortfolioGraphCard = ({ showAssets }: Props) => {
  const areAccountsEmpty = useSelector(areAccountsEmptySelector);
  const portfolio = usePortfolioAllAccounts();
  const counterValueCurrency = useCounterValueCurrency();

  // All hooks must be called before any conditional returns
  const [graphCardEndPosition, setGraphCardEndPosition] = useState(0);
  const currentPositionY = useSharedValue(0);

  const onPortfolioCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setGraphCardEndPosition(y + height / 10);
  }, []);

  if (!counterValueCurrency) {
    return null; // or loading placeholder
  }

  return (
    <Box onLayout={onPortfolioCardLayout}>
      <GraphCardContainer
        counterValueCurrency={counterValueCurrency}
        portfolio={portfolio}
        areAccountsEmpty={areAccountsEmpty}
        showGraphCard={showAssets}
        currentPositionY={currentPositionY}
        graphCardEndPosition={graphCardEndPosition}
      />
    </Box>
  );
};

export default React.memo(PortfolioGraphCard);
