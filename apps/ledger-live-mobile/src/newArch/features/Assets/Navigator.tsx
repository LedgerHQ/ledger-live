import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useRoute } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { track } from "~/analytics";
import { NavigationHeaderCloseButtonAdvanced } from "~/components/NavigationHeaderCloseButton";
import { AssetsListNavigator } from "./screens/AssetsList/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import AssetsList from "./screens/AssetsList";

export default function Navigator() {
  const { colors } = useTheme();
  const route = useRoute();
  const accountListUIFF = useFeature("llmAccountListUI");

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
      {accountListUIFF?.enabled && (
        <Stack.Screen
          name={ScreenName.AssetsList}
          component={AssetsList}
          options={{
            headerTitle: "",
          }}
        />
      )}
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<AssetsListNavigator>();
