import React, { useEffect, useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";

import { useTheme } from "styled-components/native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { ScreenName, NavigatorName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import { useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";

import type { EarnLiveAppNavigatorParamList } from "./types/EarnLiveAppNavigator";
import type { BaseComposite, StackNavigatorProps } from "./types/helpers";
import { EarnScreen } from "../../screens/PTX/Earn";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { accountsSelector } from "../../reducers/accounts";
import { EarnInfoDrawer } from "../../screens/PTX/Earn/EarnInfoDrawer";

const Stack = createStackNavigator<EarnLiveAppNavigatorParamList>();

type NavigationProps = BaseComposite<
  StackNavigatorProps<EarnLiveAppNavigatorParamList, ScreenName.Earn>
>;

const Earn = (props: NavigationProps) => {
  // Earn dashboard feature flag
  const ptxEarn = useFeature("ptxEarn");
  const paramAction = props.route.params?.action;
  const navigation = props.navigation;
  const accounts = useSelector(accountsSelector);
  const route = useRoute();

  useEffect(() => {
    if (!ptxEarn?.enabled) {
      return navigation.pop();
    }
    if (!paramAction) {
      return;
    }

    // Reset params so that it will retrigger actions if a new deeplink is used
    const clearDeepLink = () =>
      navigation.setParams({ action: undefined, accountId: undefined, currencyId: undefined });

    async function deeplinkRouting() {
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
            navigation.navigate(NavigatorName.StakeFlow, {
              screen: ScreenName.Stake,
              params: {
                account,
                parentRoute: route,
              },
            });
          } else {
            // eslint-disable-next-line no-console
            console.log("no matching account found for given id.");
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
                // Stake flow will get CryptoCurrency and Account, and navigate to NoFunds flow:
                alwaysShowNoFunds: true, // Navigate to NoFunds even if some funds available.
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

    return clearDeepLink();
  }, [paramAction, ptxEarn?.enabled, props.route.params, accounts, navigation, route]);

  return (
    <>
      <EarnScreen
        navigation={props.navigation}
        route={{
          ...props.route,
          params: {
            platform: ptxEarn?.params?.liveAppId || "earn",
          },
        }}
      />
      <EarnInfoDrawer />
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
