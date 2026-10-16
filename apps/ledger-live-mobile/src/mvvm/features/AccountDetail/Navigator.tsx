import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import AccountDetail from "./screens/AccountDetail";
import AdvancedLogs from "./screens/AdvancedLogs";
import EditName from "./screens/EditName";
import type { AccountDetailNavigatorParamsList } from "./types";

const Stack = createLumenNativeStackNavigator<AccountDetailNavigatorParamsList>();

type Props = Readonly<{ accountId: string }>;

export default function AccountDetailNavigator({ accountId }: Props) {
  const { theme } = useLumenTheme();
  const { t } = useTranslation();

  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme), [theme]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.AccountDetail}
        component={AccountDetail}
        navigationKey={accountId}
        initialParams={{ accountId }}
        options={{ title: "" }}
      />
      <Stack.Screen
        name={ScreenName.AccountDetailAdvancedLogs}
        component={AdvancedLogs}
        options={{ title: t("accountDetailSettings.advancedLogs.title") }}
      />
      <Stack.Screen
        name={ScreenName.AccountDetailEditName}
        component={EditName}
        options={{ title: t("accountDetail.editName.title") }}
      />
    </Stack.Navigator>
  );
}
