import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { track } from "~/analytics";
import { AssetsNavigatorParamsList } from "./types";
import AssetsList from "./screens/AssetsList";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";

export default function Navigator() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  const goBack = useCallback(() => {
    track("button_clicked", {
      button: "Back",
      page: route.name,
    });
    navigation.goBack();
  }, [navigation, route]);

  const stackNavigationConfig = useMemo(
    () => ({
      ...getStackNavigatorConfig(colors, true),
      headerLeft: () => <NavigationHeaderBackButton onPress={goBack} />,
    }),
    [colors, goBack],
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

const Stack = createNativeStackNavigator<AssetsNavigatorParamsList>();
