import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import { PayTabScreen } from "./screens/PayTab";
import { PayTabRequestReceiveScreen } from "./screens/RequestReceive";
import { PaySelectContactScreen } from "./screens/PaySelectContact";
import type { PayTabNavigatorParamList } from "./types";

const TabStack = createLumenNativeStackNavigator<PayTabNavigatorParamList>();

export default function PayTabNavigator() {
  const { t } = useTranslation();
  const { theme } = useLumenTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme), [theme]);

  return (
    <TabStack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        headerShown: false,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <TabStack.Screen name={ScreenName.PayTab} component={PayTabScreen} />
      <TabStack.Screen
        name={ScreenName.PayTabRequestReceive}
        component={PayTabRequestReceiveScreen}
      />
      <TabStack.Screen
        name={ScreenName.PayTabSelectContact}
        component={PaySelectContactScreen}
        options={{
          headerShown: true,
          title: t("payTab.contacts.seeAllTitle"),
          ...stackNavigationConfig,
        }}
      />
    </TabStack.Navigator>
  );
}
