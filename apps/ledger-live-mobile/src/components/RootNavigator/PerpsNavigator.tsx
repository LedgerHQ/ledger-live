import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { PerpsNavigatorParamList } from "./types/PerpsNavigator";
import { PerpsLiveAppWrapper } from "LLM/features/Perps";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";

const Stack = createNativeStackNavigator<PerpsNavigatorParamList>();

export default function PerpsNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();

  const options = useMemo(
    () => ({
      ...("options" in noNanoBuyNanoWallScreenOptions
        ? noNanoBuyNanoWallScreenOptions.options
        : {}),
      headerTitle: "",
      headerLeft: () => null,
    }),
    [noNanoBuyNanoWallScreenOptions],
  );

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig, headerShown: false }}>
      <Stack.Screen
        name={ScreenName.PerpsTab}
        component={PerpsLiveAppWrapper}
        {...noNanoBuyNanoWallScreenOptions}
        options={options}
      />
    </Stack.Navigator>
  );
}
