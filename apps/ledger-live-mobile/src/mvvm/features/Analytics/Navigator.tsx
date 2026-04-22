import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "~/context/Locale";
import { ScreenName } from "~/const";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import NavigationHeaderCloseButton from "LLM/components/Navigation/HeaderCloseButton";
import AnalyticsMain from "./screens/AnalyticsMain";
import DetailedAllocation from "./screens/DetailedAllocation";
import { AnalyticsNavigatorParamsList } from "./types";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";

const Stack = createLumenNativeStackNavigator<AnalyticsNavigatorParamsList>();

type DetailedAllocationNavigation = StackNavigatorNavigation<
  AnalyticsNavigatorParamsList,
  ScreenName.DetailedAllocation
>;

const renderHeaderRight = (navigation: DetailedAllocationNavigation) => {
  const handleClose = () => {
    navigation.goBack();
  };
  return <NavigationHeaderCloseButton onClose={handleClose} />;
};

export default function Navigator() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme), [theme]);

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
          lumenNavBar: {
            renderTrailing: () => null,
          },
        })}
      />
      <Stack.Screen
        name={ScreenName.DetailedAllocation}
        component={DetailedAllocation}
        options={({ navigation }) => ({
          title: t("analyticsAllocation.allocation.title"),
          lumenNavBar: {
            renderLeading: () => null,
            renderTrailing: () => renderHeaderRight(navigation),
          },
          animation: "slide_from_bottom",
        })}
      />
    </Stack.Navigator>
  );
}
