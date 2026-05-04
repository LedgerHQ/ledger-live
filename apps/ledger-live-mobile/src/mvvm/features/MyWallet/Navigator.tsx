import React, { useMemo } from "react";
import { Platform } from "react-native";
import type { NativeStackHeaderRightProps } from "@react-navigation/native-stack";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import { MyWalletScreen } from "./index";
import { MyWalletHelpScreen } from "./screens/Help";
import { MyWalletNavigatorStackParamList } from "./types";
import { MyWalletHeaderTrailing } from "./views/Header";

function renderMyWalletHeaderTrailing(_props: NativeStackHeaderRightProps) {
  return <MyWalletHeaderTrailing />;
}

const Stack = createLumenNativeStackNavigator<MyWalletNavigatorStackParamList>();

export default function MyWalletNavigator() {
  const { t } = useTranslation();
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
        name={ScreenName.MyWallet}
        component={MyWalletScreen}
        options={{
          title: "",
          lumenNavBar: {
            renderCenter: () => null,
            renderTrailing: renderMyWalletHeaderTrailing,
          },
        }}
      />
      <Stack.Screen
        name={ScreenName.MyWalletHelp}
        component={MyWalletHelpScreen}
        options={{ headerShown: true, title: t("myWallet.help.title"), ...stackNavigationConfig }}
      />
    </Stack.Navigator>
  );
}
