import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { ScreenName } from "~/const";
import { AleoAddAccountParamList, AleoViewKeyFlowParamList } from "./types";
import ViewKeyWarningScreen from "./ViewKeyWarningScreen";
import ViewKeyApproveScreen from "./ViewKeyApproveScreen";
import ViewKeyRejectedScreen from "./ViewKeyRejectedScreen";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type Props = StackNavigatorProps<AleoAddAccountParamList, ScreenName.AleoAddAccount>;

const Stack = createNativeStackNavigator<AleoViewKeyFlowParamList>();

function AddAccountNavigator({ route }: Props) {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  const initialRouteName = route.params.initialRoute ?? ScreenName.AleoViewKeyWarning;

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.AleoViewKeyWarning}
        component={ViewKeyWarningScreen}
        initialParams={route.params}
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name={ScreenName.AleoViewKeyApprove}
        component={ViewKeyApproveScreen}
        initialParams={
          route.params.accountsToAdd
            ? { ...route.params, accountsToAdd: route.params.accountsToAdd }
            : route.params
        }
        options={{ headerTitle: "" }}
      />
      <Stack.Screen
        name={ScreenName.AleoViewKeyRejected}
        component={ViewKeyRejectedScreen}
        initialParams={route.params}
        options={{ headerTitle: "" }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};
export { AddAccountNavigator as component, options };
export default AddAccountNavigator;
