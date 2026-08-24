import { useFeature } from "@features/platform-feature-flags";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { AppLockPasswordAddNavigator } from "LLM/features/AppLock/Navigator";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import ConfirmPassword from "~/screens/Settings/General/ConfirmPassword";
import PasswordAdd from "~/screens/Settings/General/PasswordAdd";
import { LegacyPasswordAddFlowParamList } from "./types/PasswordAddFlowNavigator";

const LegacyStack = createNativeStackNavigator<LegacyPasswordAddFlowParamList>();

function LegacyPasswordAddFlowNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <LegacyStack.Navigator screenOptions={stackNavigationConfig}>
      <LegacyStack.Screen
        name={ScreenName.PasswordAdd}
        component={PasswordAdd}
        options={{
          title: t("auth.addPassword.title"),
        }}
      />
      <LegacyStack.Screen
        name={ScreenName.ConfirmPassword}
        component={ConfirmPassword}
        options={{
          title: t("auth.confirmPassword.title"),
        }}
      />
    </LegacyStack.Navigator>
  );
}

export default function PasswordAddFlowNavigator() {
  const passwordRevamp = useFeature("lwmPasswordRevamp");

  return passwordRevamp?.enabled ? (
    <AppLockPasswordAddNavigator />
  ) : (
    <LegacyPasswordAddFlowNavigator />
  );
}
