import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { getStackNavigationConfigV4 } from "LLM/components/Navigation/getStackNavigationConfigV4";
import { ScreenName } from "~/const";
import { MyWalletScreen } from "./index";
import { MyWalletNavigatorStackParamList } from "./types";

const Stack = createNativeStackNavigator<MyWalletNavigatorStackParamList>();

export default function MyWalletNavigator() {
  const { theme: lumenTheme } = useLumenTheme();
  const stackNavConfigV4 = useMemo(() => getStackNavigationConfigV4(lumenTheme), [lumenTheme]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.MyWallet}
        component={MyWalletScreen}
        options={{ headerShown: false, ...stackNavConfigV4 }}
      />
    </Stack.Navigator>
  );
}
