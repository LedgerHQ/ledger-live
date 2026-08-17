import { PasswordDraftProvider } from "@features/flow-app-lock";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import React, { useMemo } from "react";
import { Platform } from "react-native";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import type { PasswordAddFlowParamList } from "~/components/RootNavigator/types/PasswordAddFlowNavigator";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { ConfirmPasswordScreen } from "./screens/ConfirmPassword";
import { SetupPasswordScreen } from "./screens/SetupPassword";

const Stack = createLumenNativeStackNavigator<PasswordAddFlowParamList>();

export function AppLockPasswordAddNavigator(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const stackNavigationConfig = useMemo(
    () => getStackNavigationConfigV4(theme, "expanded"),
    [theme],
  );

  return (
    <PasswordDraftProvider>
      <Stack.Navigator
        screenOptions={{ ...stackNavigationConfig, gestureEnabled: Platform.OS === "ios" }}
      >
        <Stack.Screen
          name={ScreenName.PasswordAdd}
          component={SetupPasswordScreen}
          options={{
            title: t("appLock.setupPassword.title"),
            lumenNavBar: { description: t("appLock.setupPassword.description") },
          }}
        />
        <Stack.Screen
          name={ScreenName.ConfirmPassword}
          component={ConfirmPasswordScreen}
          options={{
            title: t("appLock.confirmPassword.title"),
            lumenNavBar: { description: t("appLock.confirmPassword.description") },
          }}
        />
      </Stack.Navigator>
    </PasswordDraftProvider>
  );
}
