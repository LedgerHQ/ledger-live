import React, { useMemo } from "react";
import { Platform } from "react-native";
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import { track } from "~/analytics";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { NavigationHeaderCloseButton } from "~/components/NavigationHeaderCloseButton";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import AnalyticsMain from "./screens/AnalyticsMain";
import DetailedAllocation from "./screens/DetailedAllocation";
import { AnalyticsNavigatorParamsList } from "./types";
import { RouteProp } from "@react-navigation/native";

type NavigationProps = NativeStackNavigationProp<
  AnalyticsNavigatorParamsList,
  ScreenName.Analytics | ScreenName.DetailedAllocation,
  undefined
>;

type RouteProps = RouteProp<
  AnalyticsNavigatorParamsList,
  ScreenName.Analytics | ScreenName.DetailedAllocation
>;

type HeaderProps = {
  navigation: NavigationProps;
  route: RouteProps;
};

export default function Navigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  const headerLeft = ({ navigation, route }: HeaderProps) => {
    const handleBack = () => {
      track("button_clicked", {
        button: "Back",
        page: route.name,
      });
      navigation.goBack();
    };
    return <NavigationHeaderBackButton extraMarginLeft={8} onPress={handleBack} />;
  };

  const headerRight = ({ navigation, route }: HeaderProps) => {
    const handleClose = () => {
      track("button_clicked", {
        button: "Close",
        page: route.name,
      });
      navigation.goBack();
    };
    return <NavigationHeaderCloseButton onPress={handleClose} />;
  };

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
        options={({ navigation, route }) => ({
          headerTitle: t("analyticsAllocation.header.main"),
          headerRight: () => null,
          headerLeft: () => headerLeft({ navigation, route }),
        })}
      />
      <Stack.Screen
        name={ScreenName.DetailedAllocation}
        component={DetailedAllocation}
        options={({ navigation, route }) => ({
          headerTitle: t("analyticsAllocation.allocation.title"),
          headerRight: () => headerRight({ navigation, route }),
          headerLeft: () => null,
          animation: "slide_from_bottom",
        })}
      />
    </Stack.Navigator>
  );
}

const Stack = createNativeStackNavigator<AnalyticsNavigatorParamsList>();
