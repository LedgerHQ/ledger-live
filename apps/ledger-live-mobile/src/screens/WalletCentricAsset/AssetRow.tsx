import React, { useCallback } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { BigNumber } from "bignumber.js";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "../../const";
import { usePortfolio } from "../../hooks/portfolio";
import AssetRowLayout from "../../components/AssetRowLayout";
import { track } from "../../analytics";
import {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "../../components/RootNavigator/types/helpers";
import { AccountsNavigatorParamList } from "../../components/RootNavigator/types/AccountsNavigator";
import { PortfolioNavigatorStackParamList } from "../../components/RootNavigator/types/PortfolioNavigator";

type Asset = {
  currency: CryptoOrTokenCurrency;
  accounts: AccountLike[];
  distribution?: number;
  amount: number;
  countervalue?: number;
};

export type NavigationProp = BaseNavigationComposite<
  | StackNavigatorNavigation<AccountsNavigatorParamList, ScreenName.Assets>
  | StackNavigatorNavigation<PortfolioNavigatorStackParamList>
>;

type Props = {
  asset: Asset;
  navigation: NavigationProp;
  navigationParams?: Parameters<NavigationProp["navigate"]>;
  hideDelta?: boolean;
  topLink?: boolean;
  bottomLink?: boolean;
};

const AssetRow = ({
  asset,
  navigation,
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

  const { countervalueChange } = usePortfolio(asset.accounts);

  const onAssetPress = useCallback(() => {
    track("asset_clicked", {
      asset: currency.name,
    });
    if (navigationParams) {
      // @ts-expect-error Ok, please stop doing this.
      navigation.navigate(...navigationParams);
    } else {
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Asset,
        params: {
          currency,
        },
      });
    }
  }, [currency, navigation, navigationParams]);

  return (
    <AssetRowLayout
      onPress={onAssetPress}
      currency={currency}
      currencyUnit={unit}
      balance={new BigNumber(asset.amount)}
      name={name}
      countervalueChange={countervalueChange}
      topLink={topLink}
      bottomLink={bottomLink}
      hideDelta={hideDelta}
    />
  );
};

export default React.memo(AssetRow);
