import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";

import SelectToken from "./01-SelectToken";
import Summary from "./02-Summary";
import ValidationError from "./04-ValidationError";
import ValidationSuccess from "./04-ValidationSuccess";
import type { HederaAssociateTokenFlowParamList } from "./types";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { NavigationHeaderCloseButtonAdvanced } from "~/components/NavigationHeaderCloseButton";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";

function AssociateTokenFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.HederaAssociateTokenSelectToken}
        component={SelectToken}
        options={{
          headerLeft: () => <NavigationHeaderBackButton />,
          headerTitle: "",
          headerRight: () => <NavigationHeaderCloseButtonAdvanced />,
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaAssociateTokenSummary}
        component={Summary}
        options={{
          headerLeft: () => <NavigationHeaderBackButton />,
          headerTitle: t("hedera.associate.summary.title"),
          headerRight: () => <NavigationHeaderCloseButtonAdvanced />,
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaAssociateTokenSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: t("hedera.associate.selectDevice.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaAssociateTokenConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: t("hedera.associate.connectDevice.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaAssociateTokenValidationError}
        component={ValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.HederaAssociateTokenValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};

export { AssociateTokenFlow as component, options };

const Stack = createNativeStackNavigator<HederaAssociateTokenFlowParamList>();
