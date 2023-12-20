import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import PasswordRemove from "~/screens/Settings/General/PasswordRemove";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { PasswordModifyFlowParamList } from "./types/PasswordModifyFlowNavigator";

const Stack = createStackNavigator<PasswordModifyFlowParamList>();

export default function PasswordModifyFlowNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.PasswordRemove}
        component={PasswordRemove}
        options={{
          title: t("auth.confirmPassword.title"),
        }}
      />
    </Stack.Navigator>
  );
}
