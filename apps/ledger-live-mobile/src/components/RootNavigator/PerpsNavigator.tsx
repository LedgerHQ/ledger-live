import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { PerpsNavigatorParamList } from "./types/PerpsNavigator";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import { PerpsLiveAppWrapper } from "LLM/features/Perps";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";

const Stack = createNativeStackNavigator<PerpsNavigatorParamList>();

export default function PerpsNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();

  const options = useMemo(
    () => ({
      ...("options" in noNanoBuyNanoWallScreenOptions
        ? noNanoBuyNanoWallScreenOptions.options
        : {}),
      headerTitle: t("perps.title", { defaultValue: "Perps" }),
      headerLeft: () => <NavigationHeaderBackButton />,
    }),
    [noNanoBuyNanoWallScreenOptions, t],
  );

  return (
    <Stack.Navigator screenOptions={{ ...stackNavigationConfig, headerShown: true }}>
      <Stack.Screen
        name={ScreenName.PerpsTab}
        component={PerpsLiveAppWrapper}
        {...noNanoBuyNanoWallScreenOptions}
        options={options}
      />
    </Stack.Navigator>
  );
}
