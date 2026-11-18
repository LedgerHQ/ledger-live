import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { bridgeSuspenseScreenLayout, getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import ConnectDevice from "~/screens/ConnectDevice";
import SelectDevice from "~/screens/SelectDevice";
import BalanceLimit from "./BalanceLimit";
import ManageToken from "./ManageToken";
import TokenSettings from "./TokenSettings";
import ValidationError from "./ValidationError";
import ValidationSuccess from "./ValidationSuccess";
import type { XrpManageTokenFlowParamList } from "./types";

const Stack = createNativeStackNavigator<XrpManageTokenFlowParamList>();

const options = {
  headerShown: false,
};

function renderBackButton() {
  return <NavigationHeaderBackButton />;
}

function ManageTokenFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { theme } = useLumenTheme();
  const canvas = { backgroundColor: theme.colors.bg.canvas };
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        contentStyle: canvas,
        headerStyle: canvas,
        gestureEnabled: Platform.OS === "ios",
      }}
      screenLayout={bridgeSuspenseScreenLayout}
    >
      <Stack.Screen
        name={ScreenName.XrpManageTokenList}
        component={ManageToken}
        options={{
          headerLeft: renderBackButton,
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpManageTokenSettings}
        component={TokenSettings}
        options={{
          headerLeft: renderBackButton,
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpManageTokenBalanceLimit}
        component={BalanceLimit}
        options={{
          headerLeft: renderBackButton,
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpManageTokenSelectDevice}
        component={SelectDevice}
        options={{ headerTitle: t("xrp.addToken.steps.selectDevice.title") }}
      />
      <Stack.Screen
        name={ScreenName.XrpManageTokenConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: t("xrp.addToken.steps.connectDevice.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpManageTokenValidationError}
        component={ValidationError}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name={ScreenName.XrpManageTokenValidationSuccess}
        component={ValidationSuccess}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

export { ManageTokenFlow as component, options };
