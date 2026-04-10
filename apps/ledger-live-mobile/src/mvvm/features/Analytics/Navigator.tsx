import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { ScreenName } from "~/const";
import AnalyticsMain from "./screens/AnalyticsMain";
import DetailedAllocation from "./screens/DetailedAllocation";
import { AnalyticsNavigatorParamsList } from "./types";
import { getStackNavigationConfigV4 } from "LLM/components/Navigation/getStackNavigationConfigV4";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";

export default function Navigator() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme, true), [theme]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.Analytics}
        component={AnalyticsMain}
        options={() => ({
          title: t("analyticsAllocation.header.main"),
          headerRight: () => null,
        })}
      />
      <Stack.Screen
        name={ScreenName.DetailedAllocation}
        component={DetailedAllocation}
        options={() => ({
          title: t("analyticsAllocation.allocation.title"),
          headerLeft: () => null,
          animation: "slide_from_bottom",
        })}
      />
    </Stack.Navigator>
  );
}

const Stack = createNativeStackNavigator<AnalyticsNavigatorParamsList>();
