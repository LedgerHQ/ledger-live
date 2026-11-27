import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { bridgeSuspenseScreenLayout } from "~/navigation/navigatorConfig";
import BalanceLimit from "./BalanceLimit";
import ManageToken from "./ManageToken";
import TokenSettings from "./TokenSettings";
import type { XrpManageTokenFlowParamList } from "./types";

const Stack = createLumenNativeStackNavigator<XrpManageTokenFlowParamList>();

const options = {
  headerShown: false,
};

function ManageTokenFlow() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme), [theme]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
      screenLayout={bridgeSuspenseScreenLayout}
    >
      <Stack.Screen
        name={ScreenName.XrpManageTokenList}
        component={ManageToken}
        options={{
          title: t("xrp.manageAssets.title"),
          lumenNavBar: { density: "expanded" },
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpManageTokenSettings}
        component={TokenSettings}
        options={{
          title: t("xrp.tokenSettings.editTitle"),
          lumenNavBar: { density: "expanded" },
        }}
      />
      <Stack.Screen
        name={ScreenName.XrpManageTokenBalanceLimit}
        component={BalanceLimit}
        options={{
          title: t("xrp.tokenSettings.balanceLimit"),
          lumenNavBar: {
            density: "expanded",
            description: t("xrp.tokenSettings.balanceLimitDescription"),
          },
        }}
      />
    </Stack.Navigator>
  );
}

export { ManageTokenFlow as component, options };
