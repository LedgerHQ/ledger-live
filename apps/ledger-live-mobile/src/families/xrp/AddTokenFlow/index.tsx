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
import Review from "./Review";
import SelectToken from "./SelectToken";
import Settings from "./Settings";
import ValidationError from "./ValidationError";
import ValidationSuccess from "./ValidationSuccess";
import type { XrpAddTokenFlowParamList } from "./types";

const Stack = createNativeStackNavigator<XrpAddTokenFlowParamList>();

const options = {
  headerShown: false,
};

const renderBackButton = () => <NavigationHeaderBackButton />;
const renderCloseButton = () => <NavigationHeaderCloseButtonAdvanced />;

function AddTokenFlow() {
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
        name={ScreenName.XrpAddTokenSelectToken}
        component={SelectToken}
        options={{
          headerLeft: renderBackButton,
          headerTitle: t("xrp.addToken.steps.token.title"),
          headerRight: renderCloseButton,
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpAddTokenSettings}
        component={Settings}
        options={{
          headerLeft: renderBackButton,
          headerTitle: t("xrp.addToken.steps.settings.title"),
          headerRight: renderCloseButton,
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpAddTokenReview}
        component={Review}
        options={{
          headerLeft: renderBackButton,
          headerTitle: t("xrp.addToken.steps.review.title"),
          headerRight: renderCloseButton,
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpAddTokenSelectDevice}
        component={SelectDevice}
        options={{ headerTitle: t("xrp.addToken.steps.selectDevice.title") }}
      />
      <Stack.Screen
        name={ScreenName.XrpAddTokenConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: undefined,
          gestureEnabled: false,
          headerTitle: t("xrp.addToken.steps.connectDevice.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpAddTokenValidationError}
        component={ValidationError}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name={ScreenName.XrpAddTokenValidationSuccess}
        component={ValidationSuccess}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

export { AddTokenFlow as component, options };
