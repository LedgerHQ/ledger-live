import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { CARD_APP_ID } from "@ledgerhq/live-common/wallet-api/constants";
import { NavigatorName, ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";

import styles from "~/navigation/styles";
import type { StackNavigatorProps } from "./types/helpers";
import { PtxScreen } from "~/screens/PTX";
import { useTranslation } from "react-i18next";
import { PtxNavigatorParamList } from "~/components/RootNavigator/types/PtxNavigator";

const Stack = createStackNavigator<PtxNavigatorParamList>();

const Card = (_props: StackNavigatorProps<PtxNavigatorParamList, ScreenName.Card>) => {
  const { t } = useTranslation();
  const defaultPlatform = CARD_APP_ID;
  return (
    <PtxScreen
      {..._props}
      config={{
        screen: ScreenName.Card,
        navigator: NavigatorName.Card,
        btnText: t("browseWeb3.webPlatformPlayer.back.card"),
      }}
      route={{
        ..._props.route,
        params: {
          goToURL: _props.route.params?.goToURL,
          lastScreen: _props.route.params?.lastScreen,
          platform: _props.route.params?.platform || defaultPlatform,
          referrer: _props.route.params?.referrer,
        },
      }}
    />
  );
};

export default function CardAppNavigator(_props?: Record<string, unknown>) {
  const { colors } = useTheme();

  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator {...stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.Card}
        options={{
          headerStyle: styles.headerNoShadow,
          title: "",
        }}
      >
        {props => <Card {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
