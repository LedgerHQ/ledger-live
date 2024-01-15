import React, { useCallback } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import {
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import { TokenAccount, AccountLike, ChildAccount } from "@ledgerhq/types-live";
import { DerivationMode, getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";
import { useSelector } from "react-redux";
import { GestureResponderEvent } from "react-native";
import { useStartProfiler } from "@shopify/react-native-performance";
import { NavigatorName, ScreenName } from "~/const";
import { useBalanceHistoryWithCountervalue } from "~/hooks/portfolio";
import AccountRowLayout from "~/components/AccountRowLayout";
import { parentAccountSelector } from "~/reducers/accounts";
import { track } from "~/analytics";
import { State } from "~/reducers/types";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { MarketNavigatorStackParamList } from "~/components/RootNavigator/types/MarketNavigator";

type Navigation = BaseComposite<
  | StackNavigatorProps<AccountsNavigatorParamList, ScreenName.Asset | ScreenName.Accounts>
  | StackNavigatorProps<MarketNavigatorStackParamList, ScreenName.MarketDetail>
>;

type Props = {
  account: AccountLike;
  accountId: string;
  navigation: Navigation["navigation"];
  isLast?: boolean;
  onSetAccount?: (arg: TokenAccount) => void;
  navigationParams?: [ScreenName, object];
  hideDelta?: boolean;
  topLink?: boolean;
  bottomLink?: boolean;
  sourceScreenName: ScreenName;
};

const AccountRow = ({
  navigation,
  account,
  accountId,
  navigationParams,
  hideDelta,
  topLink,
  bottomLink,
  isLast,
  sourceScreenName,
}: Props) => {
  const startNavigationTTITimer = useStartProfiler();
  // makes it refresh if this changes
  useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const currency = getAccountCurrency(account);
  const parentAccount = useSelector((state: State) =>
    parentAccountSelector(state, { account: account as ChildAccount }),
  );

  const name = getAccountName(account);
  const unit = getAccountUnit(account);

  const tag =
    account.type === "Account" &&
    account?.derivationMode !== undefined &&
    account?.derivationMode !== null &&
    currency.type === "CryptoCurrency" &&
    getTagDerivationMode(currency, account.derivationMode as DerivationMode);

  const parentId = (account as TokenAccount)?.parentId;

  const { countervalueChange } = useBalanceHistoryWithCountervalue({
    account,
    range: "day",
  });

  const onAccountPress = useCallback(
    (uiEvent: GestureResponderEvent) => {
      track("account_clicked", {
        currency: currency.name,
      });
      if (navigationParams) {
        startNavigationTTITimer({ source: sourceScreenName, uiEvent });
        // @ts-expect-error navigagtion spread, ask your mom about it
        navigation.navigate(...navigationParams);
      } else if (account.type === "Account") {
        startNavigationTTITimer({ source: sourceScreenName, uiEvent });
        navigation.navigate(ScreenName.Account, {
          accountId,
        });
      } else if (account.type === "TokenAccount") {
        startNavigationTTITimer({ source: sourceScreenName, uiEvent });
        navigation.navigate(NavigatorName.Accounts, {
          screen: ScreenName.Account,
          params: {
            currencyId: currency.id,
            parentId,
            accountId: account.id,
          },
        });
      }
    },
    [
      account.id,
      account.type,
      accountId,
      currency.id,
      currency.name,
      navigation,
      navigationParams,
      parentId,
      sourceScreenName,
      startNavigationTTITimer,
    ],
  );

  return (
    <AccountRowLayout
      onPress={onAccountPress}
      currency={currency}
      currencyUnit={unit}
      balance={account.balance}
      name={name}
      countervalueChange={countervalueChange}
      tag={tag}
      topLink={topLink}
      bottomLink={bottomLink}
      hideDelta={hideDelta}
      parentAccountName={parentAccount && getAccountName(parentAccount)}
      isLast={isLast}
    />
  );
};

export default React.memo<Props>(AccountRow);
