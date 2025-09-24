import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { ModularDrawerNavigatorStackParamList } from "../../../components/RootNavigator/types/ModularDrawerNavigator";
import { ModularDrawerDeepLinkHandler } from "./screens/ModularDrawerDeepLinkHandler";

const Stack = createNativeStackNavigator<ModularDrawerNavigatorStackParamList>();

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
    </Stack.Navigator>
  );
}
