import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import Step1Cropping from "../../screens/CustomImage/Step1Crop";
import Step2Preview from "../../screens/CustomImage/Step2Preview";
import DebugScreen from "../../screens/CustomImage/DebugScreen";
import Step3Transfer from "../../screens/CustomImage/Step3Transfer";
import ErrorScreen from "../../screens/CustomImage/ErrorScreen";

const Empty = () => null;

export default function CustomImageNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.CustomImageStep1Crop}
        component={Step1Cropping}
        options={{ title: "" }}
      />
      <Stack.Screen
        name={ScreenName.CustomImageStep2Preview}
        component={Step2Preview}
        options={{ title: "" }}
      />
      <Stack.Screen
        name={ScreenName.CustomImageStep3Transfer}
        component={Step3Transfer}
        options={{ title: "" }}
      />
      <Stack.Screen
        name={ScreenName.CustomImageErrorScreen}
        component={ErrorScreen}
        options={{ title: "", headerLeft: Empty }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
