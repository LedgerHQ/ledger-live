import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { ModularDrawerNavigatorStackParamList } from "../../../components/RootNavigator/types/ModularDrawerNavigator";
import {
  ModularDrawerDeepLinkHandler,
  ReceiveDeepLinkHandler,
  AddAccountDeepLinkHandler,
} from "./screens/ModularDrawerDeepLinkHandler";

const Stack = createStackNavigator<ModularDrawerNavigatorStackParamList>();

export default function ModularDrawerNavigator() {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.ModularDrawerDeepLinkHandler}
        component={ModularDrawerDeepLinkHandler}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.ReceiveDeepLinkHandler}
        component={ReceiveDeepLinkHandler}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.AddAccountDeepLinkHandler}
        component={AddAccountDeepLinkHandler}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
