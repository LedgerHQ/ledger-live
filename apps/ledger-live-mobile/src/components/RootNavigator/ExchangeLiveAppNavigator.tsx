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
import type { ExchangeLiveAppNavigatorParamList } from "./types/ExchangeLiveAppNavigator";
import type { StackNavigatorProps } from "./types/helpers";

const Stack = createStackNavigator<ExchangeLiveAppNavigatorParamList>();

const ExchangeBuy = (
  _props: StackNavigatorProps<
    ExchangeLiveAppNavigatorParamList,
    ScreenName.ExchangeBuy
  >,
) => {
  // PTX smart routing feature flag - buy sell live app flag
  const ptxSmartRoutingMobile = useFeature("ptxSmartRoutingMobile");
  return (
    <PlatformApp
      {..._props}
      route={{
        ..._props.route,
        params: {
          platform: ptxSmartRoutingMobile?.params?.liveAppId || "multibuy",
          mode: "buy",
          currency: _props.route.params?.currency
            ? findCryptoCurrencyByKeyword(_props.route.params?.currency)?.id
            : _props.route.params?.defaultCurrencyId,
          account: _props.route.params?.defaultAccountId,
        },
      }}
    />
  );
};

const ExchangeSell = (
  _props: StackNavigatorProps<
    ExchangeLiveAppNavigatorParamList,
    ScreenName.ExchangeSell
  >,
) => {
  // PTX smart routing feature flag - buy sell live app flag
  const ptxSmartRoutingMobile = useFeature("ptxSmartRoutingMobile");

  return (
    <PlatformApp
      {..._props}
      route={{
        ..._props.route,
        params: {
          platform: ptxSmartRoutingMobile?.params?.liveAppId || "multibuy",
          mode: "sell",
          currency: _props.route.params?.currency
            ? findCryptoCurrencyByKeyword(_props.route.params?.currency)?.id
            : _props.route.params?.defaultCurrencyId,
          account: _props.route.params?.defaultAccountId,
        },
      }}
    />
  );
};

export default function ExchangeLiveAppNavigator(
  _props?: Record<string, unknown>,
) {
  const { colors } = useTheme();

  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

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
        {props => <ExchangeBuy {...props} />}
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
        {props => <ExchangeSell {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
