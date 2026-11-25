import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { ScreenName } from "~/const";
import { bridgeSuspenseScreenLayout, getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import BalanceLimit from "./BalanceLimit";
import Confirmation from "./Confirmation";
import Review from "./Review";
import SelectToken from "./SelectToken";
import type { XrpAddTokenFlowParamList } from "./types";

const Stack = createNativeStackNavigator<XrpAddTokenFlowParamList>();

const options = {
  headerShown: false,
};

const renderBackButton = () => <NavigationHeaderBackButton />;

function AddTokenFlow() {
  const { colors } = useTheme();
  const { theme } = useLumenTheme();
  const canvas = { backgroundColor: theme.colors.bg.canvas };
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

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
        name={ScreenName.XrpAddTokenSelectToken}
        component={SelectToken}
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpAddTokenReview}
        component={Review}
        options={{
          headerLeft: renderBackButton,
          headerRight: undefined,
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpAddTokenBalanceLimit}
        component={BalanceLimit}
        options={{
          headerLeft: renderBackButton,
          headerRight: undefined,
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpAddTokenConfirmation}
        component={Confirmation}
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: "fade",
        }}
      />
    </Stack.Navigator>
  );
}

export { AddTokenFlow as component, options };
