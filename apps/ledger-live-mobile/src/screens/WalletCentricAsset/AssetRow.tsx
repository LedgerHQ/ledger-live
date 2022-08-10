import React, { useCallback, useMemo } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import {
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { Currency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getTagDerivationMode } from "@ledgerhq/live-common/derivation";
import { useSelector } from "react-redux";
import { useCalculate } from "@ledgerhq/live-common/countervalues/react";
import { BigNumber } from "bignumber.js";
import { NavigatorName, ScreenName } from "../../const";
import { useBalanceHistoryWithCountervalue, usePortfolio } from "../../actions/portfolio";
import { counterValueCurrencySelector } from "../../reducers/settings";
import AccountRowLayout from "../../components/AccountRowLayout";

type Props = {
  asset: any;
  assetId: string;
  navigation: any;
  isLast: boolean;
  onSetAccount: (arg: TokenAccount) => void;
  portfolioValue: number;
  navigationParams?: any[];
  hideDelta?: boolean;
  topLink?: boolean;
  bottomLink?: boolean;
};

const AssetRow = ({
  navigation,
  asset,
  assetId,
  portfolioValue,
  navigationParams,
  hideDelta,
  topLink,
  bottomLink,
}: Props) => {
  // makes it refresh if this changes
  useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const currency = asset.currency;
  const name = currency.name;
  const unit = currency.units[0];

  const countervalue = asset.countervalue;

  const portfolioPercentage = useMemo(
    () => (countervalue ? countervalue / Math.max(1, portfolioValue) : 0), // never divide by potential zero, we dont want to go towards infinity
    [countervalue, portfolioValue],
  );

  const { countervalueChange } = usePortfolio(asset.accounts);

  const onAssetPress = useCallback(() => {
    if (navigationParams) {
      navigation.navigate(...navigationParams);
    } else {
      navigation.navigate(NavigatorName.PortfolioAccounts, {
        screen: ScreenName.Asset,
        params: {
          currencyId: currency.id,
        },
      });
    }
  }, [currency.id, navigation, navigationParams]);

  return (
    <AccountRowLayout
      onPress={onAssetPress}
      currency={currency}
      currencyUnit={unit}
      balance={new BigNumber(asset.amount)}
      name={name}
      countervalueChange={countervalueChange}
      progress={portfolioPercentage}
      topLink={topLink}
      bottomLink={bottomLink}
      hideDelta={hideDelta}
    />
  );
};

export default React.memo<Props>(AssetRow);
