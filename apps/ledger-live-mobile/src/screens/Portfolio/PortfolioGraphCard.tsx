import React, { useCallback, useState } from "react";
import { Box } from "@ledgerhq/native-ui";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { LayoutChangeEvent } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSelector } from "react-redux";
import { usePortfolioAllAccounts } from "../../hooks/portfolio";
import { areAccountsEmptySelector } from "../../reducers/accounts";
import { counterValueCurrencySelector } from "../../reducers/settings";
import GraphCardContainer from "./GraphCardContainer";

type Props = {
  showAssets: boolean;
};

const PortfolioGraphCard = ({ showAssets }: Props) => {
  const areAccountsEmpty = useSelector(areAccountsEmptySelector);
  const portfolio = usePortfolioAllAccounts();
  const counterValueCurrency: Currency = useSelector(
    counterValueCurrencySelector,
  );

  const [graphCardEndPosition, setGraphCardEndPosition] = useState(0);
  const currentPositionY = useSharedValue(0);

  const onPortfolioCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setGraphCardEndPosition(y + height / 10);
  }, []);

  return (
    <Box mt={3} onLayout={onPortfolioCardLayout}>
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
