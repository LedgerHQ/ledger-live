import React from "react";
import Animated from "react-native-reanimated";
import { useSelector } from "react-redux";
import { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import AssetCentricGraphCard from "~/components/AssetCentricGraphCard";
import { usePortfolioForAccounts } from "~/hooks/portfolio";
import { counterValueCurrencySelector } from "~/reducers/settings";

type Props = {
  accounts: AccountLike[];
  currency: CryptoOrTokenCurrency;
  currentPositionY: Animated.SharedValue<number>;
  graphCardEndPosition: number;
  currencyBalance: number;
  accountsAreEmpty?: boolean;
};

const AssetGraph = ({
  accounts,
  currency,
  currentPositionY,
  graphCardEndPosition,
  accountsAreEmpty,
  currencyBalance,
}: Props) => {
  const assetPortfolio = usePortfolioForAccounts(accounts, {
    flattenSourceAccounts: false,
  });
  const counterValueCurrency: Currency = useSelector(counterValueCurrencySelector);
  return (
    <AssetCentricGraphCard
      assetPortfolio={assetPortfolio}
      counterValueCurrency={counterValueCurrency}
      currentPositionY={currentPositionY}
      graphCardEndPosition={graphCardEndPosition}
      currency={currency}
      currencyBalance={currencyBalance}
      accountsEmpty={accountsAreEmpty}
    />
  );
};

export default React.memo(AssetGraph);
