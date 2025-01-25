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

const Card = (props: StackNavigatorProps<PtxNavigatorParamList, ScreenName.Card>) => {
  const { t } = useTranslation();
  const { goToURL, lastScreen, platform, referrer } = props.route.params || {};
  return (
    <PtxScreen
      {...props}
      config={{
        screen: ScreenName.Card,
        navigator: NavigatorName.Card,
        btnText: t("browseWeb3.webPlatformPlayer.back.card"),
      }}
      route={{
        ...props.route,
        params: {
          goToURL,
          lastScreen,
          platform: platform || CARD_APP_ID,
          referrer,
        },
      }}
    />
  );
};

export default function CardLiveAppNavigator() {
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
