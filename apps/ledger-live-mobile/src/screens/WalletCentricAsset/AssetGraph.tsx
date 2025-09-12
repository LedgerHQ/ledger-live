import React from "react";
import Animated from "react-native-reanimated";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import AssetCentricGraphCard from "~/components/AssetCentricGraphCard";
import { usePortfolioForAccounts } from "~/hooks/portfolio";
import useCounterValueCurrency from "~/hooks/useCounterValueCurrency";

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
  const counterValueCurrency = useCounterValueCurrency();

  if (!counterValueCurrency) {
    return null; // or loading placeholder
  }
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
