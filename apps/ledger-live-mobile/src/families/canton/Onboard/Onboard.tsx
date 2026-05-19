import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { ScreenName } from "~/const";
import { CantonOnboardAccountParamList } from "./types";
import OnboardScreen from "./OnboardScreen";
import CantonDisclaimerScreen from "./CantonDisclaimerScreen";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type OnboardProps = StackNavigatorProps<
  CantonOnboardAccountParamList,
  ScreenName.CantonOnboardAccount
>;

function Onboard({ route }: OnboardProps) {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator
      initialRouteName={ScreenName.CantonDisclaimer}
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.CantonDisclaimer}
        component={CantonDisclaimerScreen}
        initialParams={route.params}
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name={ScreenName.CantonOnboardAccount}
        component={OnboardScreen}
        initialParams={route.params}
        options={{ headerTitle: "" }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};
export { Onboard as component, options };
export default Onboard;
const Stack = createNativeStackNavigator<CantonOnboardAccountParamList>();
