import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { NavigationHeaderCloseButtonAdvanced } from "~/components/NavigationHeaderCloseButton";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { bridgeSuspenseScreenLayout, getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import ConnectDevice from "~/screens/ConnectDevice";
import SelectDevice from "~/screens/SelectDevice";
import ManageToken from "./ManageToken";
import Review from "./Review";
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

function renderCloseButton() {
  return <NavigationHeaderCloseButtonAdvanced />;
}

function ManageTokenFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
      screenLayout={bridgeSuspenseScreenLayout}
    >
      <Stack.Screen
        name={ScreenName.XrpManageTokenManage}
        component={ManageToken}
        options={{
          headerLeft: renderBackButton,
          headerTitle: t("xrp.manageToken.title"),
          headerRight: renderCloseButton,
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpManageTokenSettings}
        component={TokenSettings}
        options={{
          headerLeft: renderBackButton,
          headerTitle: t("xrp.tokenSettings.title"),
          headerRight: renderCloseButton,
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpManageTokenReview}
        component={Review}
        options={{
          headerLeft: renderBackButton,
          headerTitle: t("xrp.addToken.steps.review.title"),
          headerRight: renderCloseButton,
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
