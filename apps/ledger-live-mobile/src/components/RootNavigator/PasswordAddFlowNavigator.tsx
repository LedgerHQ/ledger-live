import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { PasswordAddFlowParamList } from "./types/PasswordAddFlowNavigator";
import { register } from "react-native-bundle-splitter";

const PasswordAdd = register({ loader: () => import("~/screens/Settings/General/PasswordAdd") });
const ConfirmPassword = register({
  loader: () => import("~/screens/Settings/General/ConfirmPassword"),
});

const Stack = createStackNavigator<PasswordAddFlowParamList>();

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
