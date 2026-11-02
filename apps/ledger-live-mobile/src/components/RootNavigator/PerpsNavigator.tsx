import React, { useMemo } from "react";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { ScreenName } from "~/const";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import { PerpsNavigatorParamList } from "./types/PerpsNavigator";
import { PerpsLiveAppWrapper } from "LLM/features/Perps";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";

const Stack = createLumenNativeStackNavigator<PerpsNavigatorParamList>();

export default function PerpsNavigator() {
  const { theme } = useLumenTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme), [theme]);
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
