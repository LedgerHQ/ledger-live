import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useRoute } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { track } from "~/analytics";
import { NavigationHeaderCloseButtonAdvanced } from "~/components/NavigationHeaderCloseButton";
import { AssetsNavigatorParamsList } from "./types";
import AssetsList from "./screens/AssetsList";

export default function Navigator() {
  const { colors } = useTheme();
  const route = useRoute();

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      screen: route.name,
    });
  }, [route]);

  const stackNavigationConfig = useMemo(
    () => ({
      ...getStackNavigatorConfig(colors, true),
      headerRight: () => <NavigationHeaderCloseButtonAdvanced onClose={onClose} />,
    }),
    [colors, onClose],
  );

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.AssetsList}
        component={AssetsList}
        options={{
          headerTitle: "",
          headerRight: () => null,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<AssetsNavigatorParamsList>();
