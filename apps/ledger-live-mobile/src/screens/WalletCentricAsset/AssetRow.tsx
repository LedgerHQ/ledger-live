import React, { useCallback, useMemo } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { BigNumber } from "bignumber.js";
import { isEqual } from "lodash";
import { GestureResponderEvent } from "react-native";
import { useStartProfiler } from "@shopify/react-native-performance";
import { NavigatorName, ScreenName } from "~/const";
import { usePortfolioForAccounts } from "~/hooks/portfolio";
import AssetRowLayout from "~/components/AssetRowLayout";
import { track } from "~/analytics";
import {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import { PortfolioNavigatorStackParamList } from "~/components/RootNavigator/types/PortfolioNavigator";
import { Asset } from "~/types/asset";

export type NavigationProp = BaseNavigationComposite<
  | StackNavigatorNavigation<AccountsNavigatorParamList, ScreenName.Assets>
  | StackNavigatorNavigation<PortfolioNavigatorStackParamList>
>;

type Props = {
  asset: Asset;
  navigation: NavigationProp;
  hideDelta?: boolean;
  topLink?: boolean;
  bottomLink?: boolean;
  sourceScreenName: ScreenName;
};

const AssetRow = ({
  asset,
  navigation,
  hideDelta,
  topLink,
  bottomLink,
  sourceScreenName,
}: Props) => {
  // makes it refresh if this changes
  useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const startNavigationTTITimer = useStartProfiler();
  const currency = asset.currency;
  const name = currency.name;
  const unit = currency.units[0];

  // TODO: implement a much lighter hook to get this simple value
  const { countervalueChange } = usePortfolioForAccounts(asset.accounts);

  const onAssetPress = useCallback(
    (uiEvent: GestureResponderEvent) => {
      track("asset_clicked", {
        asset: currency.name,
      });
      startNavigationTTITimer({
        source: sourceScreenName,
        uiEvent,
      });
      navigation.navigate(NavigatorName.Accounts, {
        screen: ScreenName.Asset,
        params: {
          currency,
        },
      });
    },
    [currency, navigation, sourceScreenName, startNavigationTTITimer],
  );

  /**
   * Avoid passing a new object to AssetRowLayout if the value didn't actually
   * change.
   * Not a small optimisation as that component can take several milliseconds to
   * render, and it's meant to be rendered in a list.
   *  */
  const balance = useMemo(() => BigNumber(asset.amount), [asset.amount]);

  return (
    <AssetRowLayout
      onPress={onAssetPress}
      currency={currency}
      currencyUnit={unit}
      balance={balance}
      name={name}
      countervalueChange={countervalueChange}
      topLink={topLink}
      bottomLink={bottomLink}
      hideDelta={hideDelta}
    />
  );
};

export default React.memo(
  AssetRow,
  /**
   * Here we need a deep compare for the `asset` prop in particular.
   * We want to avoid recomputing usePortfolioForAccounts if the accounts value
   * did not change.
   * (That portfolio computation can take several milliseconds ~4ms for instance
   * on a performant device, in __DEV__ mode). Since it's meant to be rendered
   * in a list, this is not a small optimisation.
   */
  (prevProps, newProps) => isEqual(prevProps, newProps),
);
