import { getParentAccount, isTokenAccount } from "@ledgerhq/coin-framework/lib/account/helpers";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { useRoute } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { useTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { EarnScreen } from "~/screens/PTX/Earn";
import { EarnInfoDrawer } from "~/screens/PTX/Earn/EarnInfoDrawer";
import { EarnMenuDrawer } from "~/screens/PTX/Earn/EarnMenuDrawer";
import { EarnProtocolInfoDrawer } from "~/screens/PTX/Earn/EarnProtocolInfoDrawer";
import { useStakingDrawer } from "../Stake/useStakingDrawer";
import { useOpenStakeDrawer } from "LLM/features/Stake";
import type { EarnLiveAppNavigatorParamList } from "./types/EarnLiveAppNavigator";
import type { BaseComposite, StackNavigatorProps } from "./types/helpers";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";

const Stack = createNativeStackNavigator<EarnLiveAppNavigatorParamList>();

type NavigationProps = BaseComposite<
  StackNavigatorProps<EarnLiveAppNavigatorParamList, ScreenName.Earn>
>;

type EarnNavigation = NavigationProp<ParamListBase>;

const Earn = (props: NavigationProps) => {
  const dispatch = useDispatch();
  const paramAction = props.route.params?.action;
  const navigation: EarnNavigation = props.navigation as unknown as EarnNavigation;
  const accounts = useSelector(flattenAccountsSelector);
  const route = useRoute();

  const openStakingDrawer = useStakingDrawer({
    navigation,
    parentRoute: route,
    alwaysShowNoFunds: false,
  });

  const { handleOpenStakeDrawer } = useOpenStakeDrawer({
    sourceScreenName: "earn_app_cta",
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
        case "deposit": {
          navigation.navigate(NavigatorName.Base, {
            screen: NavigatorName.Earn,
            params: {
              screen: ScreenName.Earn,
              params: {
                intent: "deposit",
                cryptoAssetId: props.route.params?.cryptoAssetId,
                accountId: props.route.params?.accountId,
              },
            },
          });
          break;
        }
        case "stake":
          handleOpenStakeDrawer();
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
        case "go-back": {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else if (navigation.getParent()?.canGoBack()) {
            navigation.getParent()?.goBack();
          } else {
            // Fallback to main earn screen
            navigation.navigate(NavigatorName.Earn, {
              screen: ScreenName.Earn,
              params: props.route.params,
            });
          }
          break;
        }
        default: {
          console.warn(`EarnLiveAppNavigator: No route for action "${paramAction}"`);
        }
      }
    }

    deeplinkRouting();

    return () => clearDeepLink();
  }, [
    paramAction,
    props.route.params,
    accounts,
    navigation,
    route,
    openStakingDrawer,
    dispatch,
    handleOpenStakeDrawer,
  ]);

  return (
    <>
      {/* EarnScreen contains the EarnWebview */}
      <EarnScreen
        navigation={props.navigation}
        route={{
          ...props.route,
          params: {
            platform: "earn",
            ...props.route.params,
          },
        }}
      />
      <EarnProtocolInfoDrawer />
      <EarnInfoDrawer />
      <EarnMenuDrawer navigation={navigation} />
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
