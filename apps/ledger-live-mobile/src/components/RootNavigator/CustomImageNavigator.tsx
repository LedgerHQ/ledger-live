import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { ScreenName } from "../../const";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import { ParamList } from "../../screens/CustomImage/types";
import Step1Cropping from "../../screens/CustomImage/Step1Crop";
import Step2Preview from "../../screens/CustomImage/Step2Preview";
import Step3Transfer from "../../screens/CustomImage/Step3Transfer";
import ErrorScreen from "../../screens/CustomImage/ErrorScreen";

export type CustomImageParamList = ParamList;

export default function CustomImageNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.CustomImageStep1Crop as "CustomImageStep1Crop"}
        component={Step1Cropping}
        options={{ title: t("customImage.cropImage"), headerRight: undefined }}
      />
      <Stack.Screen
        name={ScreenName.CustomImageStep2Preview as "CustomImageStep2Preview"}
        component={Step2Preview}
        options={{
          title: t("customImage.chooseConstrast"),
          headerRight: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.CustomImageStep3Transfer as "CustomImageStep3Transfer"}
        component={Step3Transfer}
        options={{ title: "" }}
      />
      <Stack.Screen
        name={ScreenName.CustomImageErrorScreen as "CustomImageErrorScreen"}
        component={ErrorScreen}
        options={{ title: "", headerLeft: undefined, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<ParamList>();
