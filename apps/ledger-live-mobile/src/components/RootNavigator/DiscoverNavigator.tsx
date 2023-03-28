import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import Discover from "../../screens/Discover";
import { Catalog } from "../../screens/Platform";
import { DiscoverNavigatorStackParamList } from "./types/DiscoverNavigator";

export default function DiscoverNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.DiscoverScreen}
        component={Discover}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.PlatformCatalog}
        component={Catalog}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<DiscoverNavigatorStackParamList>();
