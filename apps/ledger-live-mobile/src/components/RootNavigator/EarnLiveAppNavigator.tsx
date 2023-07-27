import React, { useEffect, useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { ScreenName, NavigatorName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";

import type { EarnLiveAppNavigatorParamList } from "./types/EarnLiveAppNavigator";
import type { StackNavigatorNavigation, StackNavigatorProps } from "./types/helpers";
import { EarnScreen } from "../../screens/PTX/Earn";
import { BaseNavigatorStackParamList } from "./types/BaseNavigator";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { accountsSelector } from "../../reducers/accounts";

const Stack = createStackNavigator<EarnLiveAppNavigatorParamList>();

const Earn = (_props: StackNavigatorProps<EarnLiveAppNavigatorParamList, ScreenName.Earn>) => {
  // Earn dashboard feature flag
  // TODO: update to use specific mobile feature flag
  const ptxEarn = useFeature("ptxEarn");
  const paramAction = _props.route.params?.action;
  const navigation = useNavigation();
  const accounts = useSelector(accountsSelector);
  const route = useRoute();

  useEffect(() => {
    if (!ptxEarn?.enabled) {
      return (navigation as StackNavigatorNavigation<BaseNavigatorStackParamList>).pop();
    }
    if (!paramAction) {
      return;
    }

    async function deeplinkRouting() {
      // Params from deeplink route
      const action = paramAction;
      const currencyId = _props.route.params?.currencyId;
      const accountId = _props.route.params?.accountId;

      // Reset params so that it will retrigger actions if a new deeplink is used
      navigation.setParams({ action: null, accountId: null, currencyId: null });

      switch (action) {
        case "stake":
          navigation.navigate(NavigatorName.StakeFlow, {
            screen: ScreenName.Stake,
            params: {
              parentRoute: route,
            },
          });
          break;
        case "stake-account": {
          if (accountId) {
            const id = getAccountIdFromWalletAccountId(accountId);
            const account = accounts.find(acc => acc.id === id);
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
              console.log("not account found in earn dashboard deeplink");
            }
          } else {
            // eslint-disable-next-line no-console
            console.log("accountId query is missing for earn dashboard deeplink");
          }
          break;
        }
        case "get-funds": {
          if (currencyId) {
            navigation.navigate(NavigatorName.StakeFlow, {
              screen: ScreenName.Stake,
              params: { currencies: [currencyId], alwaysShowNoFunds: true },
            });
          }
          break;
        }
      }
    }
    deeplinkRouting();
  }, [paramAction, ptxEarn?.enabled]);

  return (
    <EarnScreen
      {..._props}
      route={{
        ..._props.route,
        params: {
          platform: ptxEarn?.params?.liveAppId || "earn",
        },
      }}
    />
  );
};

export default function EarnLiveAppNavigator(_props?: Record<string, unknown>) {
  const { colors } = useTheme();

  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator {...stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.Earn}
        options={{
          headerShown: false,
        }}
      >
        {props => <Earn {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
