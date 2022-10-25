import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { Icons, Flex } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { ScreenName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";

import PlatformApp from "../../screens/Platform/App";
import styles from "../../navigation/styles";

export default function ExchangeLiveAppNavigator({ route }: any) {
  const { colors } = useTheme();

  // PTX smart routing feature flag - buy sell live app flag
  const ptxSmartRoutingMobile = useFeature("ptxSmartRoutingMobile");

  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  const { params: routeParams } = route;

  return (
    <Stack.Navigator {...stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.ExchangeBuy}
        options={{
          headerBackImage: () => (
            <Flex pl="16px">
              <Icons.CloseMedium color="neutral.c100" size="20px" />
            </Flex>
          ),
          headerStyle: styles.headerNoShadow,
          headerTitle: () => null,
        }}
      >
        {(_props: any) => (
          <PlatformApp
            {..._props}
            {...routeParams}
            route={{
              ..._props.route,
              params: {
                platform:
                  ptxSmartRoutingMobile?.params?.liveAppId || "multibuy",
                mode: "buy",
                currency: _props.route.params?.currency
                  ? findCryptoCurrencyByKeyword(_props.route.params?.currency)
                      ?.id
                  : _props.route.params?.defaultCurrencyId,
                account: _props.route.params?.defaultAccountId,
              },
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name={ScreenName.ExchangeSell}
        options={{
          headerBackImage: () => (
            <Flex pl="16px">
              <Icons.CloseMedium color="neutral.c100" size="20px" />
            </Flex>
          ),
          headerStyle: styles.headerNoShadow,
          headerTitle: () => null,
        }}
      >
        {(_props: any) => (
          <PlatformApp
            {..._props}
            {...routeParams}
            route={{
              ..._props.route,
              params: {
                platform:
                  ptxSmartRoutingMobile?.params?.liveAppId || "multibuy",
                mode: "sell",
                currency: _props.route.params?.currency
                  ? findCryptoCurrencyByKeyword(_props.route.params?.currency)
                      ?.id
                  : _props.route.params?.defaultCurrencyId,
                account: _props.route.params?.defaultAccountId,
              },
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
