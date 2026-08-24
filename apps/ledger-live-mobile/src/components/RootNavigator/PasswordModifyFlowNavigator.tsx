import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import { AppLockPasswordModifyNavigator } from "LLM/features/AppLock/ModifyNavigator";
import { useAppLockScheme } from "LLM/features/AppLock/hooks/useAppLockScheme";
import { ScreenName } from "~/const";
import PasswordRemove from "~/screens/Settings/General/PasswordRemove";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { PasswordModifyFlowParamList } from "./types/PasswordModifyFlowNavigator";

const LegacyStack = createNativeStackNavigator<PasswordModifyFlowParamList>();

function LegacyPasswordModifyFlowNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <LegacyStack.Navigator screenOptions={stackNavigationConfig}>
      <LegacyStack.Screen
        name={ScreenName.PasswordRemove}
        component={PasswordRemove}
        options={{
          title: t("auth.confirmPassword.title"),
        }}
      />
    </LegacyStack.Navigator>
  );
}

export default function PasswordModifyFlowNavigator() {
  const scheme = useAppLockScheme();

  if (scheme === undefined) {
    return null;
  }

  return scheme === "revamped" ? (
    <AppLockPasswordModifyNavigator />
  ) : (
    <LegacyPasswordModifyFlowNavigator />
  );
}
