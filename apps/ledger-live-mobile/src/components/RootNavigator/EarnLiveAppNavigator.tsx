import React, { useEffect, useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";

import { useTheme } from "styled-components/native";
import { useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";

import { ScreenName, NavigatorName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import type { EarnLiveAppNavigatorParamList } from "./types/EarnLiveAppNavigator";
import type { BaseComposite, StackNavigatorProps } from "./types/helpers";
import { EarnScreen } from "~/screens/PTX/Earn";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { EarnInfoDrawer } from "~/screens/PTX/Earn/EarnInfoDrawer";
import { useStakingDrawer } from "../Stake/useStakingDrawer";
import { EarnMenuDrawer } from "~/screens/PTX/Earn/EarnMenuDrawer";
import { getParentAccount, isTokenAccount } from "@ledgerhq/coin-framework/lib/account/helpers";

const Stack = createStackNavigator<EarnLiveAppNavigatorParamList>();

type NavigationProps = BaseComposite<
  StackNavigatorProps<EarnLiveAppNavigatorParamList, ScreenName.Earn>
>;

const Earn = (props: NavigationProps) => {
  const dispatch = useDispatch();
  const paramAction = props.route.params?.action;
  const navigation = props.navigation;
  const accounts = useSelector(flattenAccountsSelector);
  const route = useRoute();

  const openStakingDrawer = useStakingDrawer({
    navigation,
    parentRoute: route,
    alwaysShowNoFunds: false,
  });

  useEffect(() => {
    if (!paramAction) {
      return;
    }

    // Reset params so that it will retrigger actions if a new deeplink is used
    const clearDeepLink = () =>
      navigation.setParams({
        action: undefined,
        accountId: undefined,
        currencyId: undefined,
      });

    function deeplinkRouting() {
      switch (paramAction) {
        case "stake":
          navigation.navigate(NavigatorName.StakeFlow, {
            screen: ScreenName.Stake,
            params: {
              parentRoute: route,
            },
          });
          break;
        case "stake-account": {
          const walletId = props.route.params?.accountId;

          if (!walletId) {
            // eslint-disable-next-line no-console
            console.log("Wallet accountId required for 'stake-account' action.");
            return;
          }

          const accountId = getAccountIdFromWalletAccountId(walletId);
          const account = accounts.find(acc => acc.id === accountId);
          if (account) {
            const parent = isTokenAccount(account)
              ? getParentAccount(account, accounts)
              : undefined;
            openStakingDrawer(account, parent);
          } else {
            console.warn("no matching account found for given id.");
          }
          break;
        }
        case "get-funds": {
          const currencyId = props.route.params?.currencyId;

          if (!currencyId) {
            // eslint-disable-next-line no-console
            console.log('currencyId required for "get-funds" action.');
          } else {
            navigation.navigate(NavigatorName.StakeFlow, {
              screen: ScreenName.Stake,
              params: {
                currencies: [currencyId],
                parentRoute: route,
                // Stake flow will skip step 1 (select CryptoCurrency) and step 2 (select Account), and navigate straight to NoFunds flow:
                alwaysShowNoFunds: true, // Navigate to NoFunds even if some funds available.
                entryPoint: "get-funds",
              },
            });
          }
          break;
        }
        default: {
          // eslint-disable-next-line no-console
          console.log(`EarnLiveAppNavigator: No route for action "${paramAction}"`);
        }
      }
    }

    deeplinkRouting();

    return () => clearDeepLink();
  }, [paramAction, props.route.params, accounts, navigation, route, openStakingDrawer, dispatch]);

  return (
    <>
      <EarnScreen
        navigation={props.navigation}
        route={{
          ...props.route,
          params: {
            platform: "earn",
          },
        }}
      />
      <EarnInfoDrawer />
      <EarnMenuDrawer />
    </>
  );
};

export default function EarnLiveAppNavigator() {
  const { colors } = useTheme();

  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator {...stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.Earn}
        options={{
          headerShown: false,
        }}
        component={Earn} // route props are passed automatically
      />
    </Stack.Navigator>
  );
}
