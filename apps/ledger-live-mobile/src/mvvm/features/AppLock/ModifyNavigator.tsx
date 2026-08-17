import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import React, { useMemo } from "react";
import { Platform } from "react-native";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import type { PasswordModifyFlowParamList } from "~/components/RootNavigator/types/PasswordModifyFlowNavigator";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { DeactivatePasswordScreen } from "./screens/DeactivatePassword";

const Stack = createLumenNativeStackNavigator<PasswordModifyFlowParamList>();

export function AppLockPasswordModifyNavigator(): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const stackNavigationConfig = useMemo(
    () => getStackNavigationConfigV4(theme, "expanded"),
    [theme],
  );

  return (
    <Stack.Navigator
      screenOptions={{ ...stackNavigationConfig, gestureEnabled: Platform.OS === "ios" }}
    >
      <Stack.Screen
        name={ScreenName.PasswordRemove}
        component={DeactivatePasswordScreen}
        options={{
          title: t("appLock.deactivatePassword.title"),
          lumenNavBar: { description: t("appLock.deactivatePassword.description") },
        }}
      />
    </Stack.Navigator>
  );
}
