import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import PasswordAdd from "~/screens/Settings/General/PasswordAdd";
import ConfirmPassword from "~/screens/Settings/General/ConfirmPassword";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { PasswordAddFlowParamList } from "./types/PasswordAddFlowNavigator";

const Stack = createNativeStackNavigator<PasswordAddFlowParamList>();

export default function PasswordAddFlowNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name={ScreenName.PasswordAdd}
        component={PasswordAdd}
        options={{
          title: t("auth.addPassword.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.ConfirmPassword}
        component={ConfirmPassword}
        options={{
          title: t("auth.confirmPassword.title"),
        }}
      />
    </Stack.Navigator>
  );
}
