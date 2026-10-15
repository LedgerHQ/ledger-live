import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { ScreenName } from "~/const";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import AccountDetail from "./screens/AccountDetail";
import type { AccountDetailNavigatorParamsList } from "./types";

const Stack = createLumenNativeStackNavigator<AccountDetailNavigatorParamsList>();

type Props = Readonly<{ accountId: string }>;

export default function AccountDetailNavigator({ accountId }: Props) {
  const { theme } = useLumenTheme();

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
        initialParams={{ accountId }}
        options={{ title: "" }}
      />
    </Stack.Navigator>
  );
}
