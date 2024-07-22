import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { WalletSyncNavigatorStackParamList } from "../../../components/RootNavigator/types/WalletSyncNavigator";
import WalletSyncActivation from "LLM/features/WalletSync/screens/Activation";
import { ActivationProcess } from "./screens/Activation/ActivationProcess";
import { ActivationSuccess } from "./screens/Activation/ActivationSuccess";
import { useInitMemberCredentials } from "./hooks/useInitMemberCredentials";
import WalletSyncManage from "./screens/Manage";
import { useTranslation } from "react-i18next";

const Stack = createStackNavigator<WalletSyncNavigatorStackParamList>();

export default function WalletSynceNavigator() {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);
  const { t } = useTranslation();
  useInitMemberCredentials();

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.WalletSyncActivationSettings}
        component={WalletSyncActivation}
        options={{
          title: "",
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name={ScreenName.WalletSyncActivationProcess}
        component={ActivationProcess}
        options={{
          title: "",
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.WalletSyncSuccess}
        component={ActivationSuccess}
        options={{
          title: "",
          headerRight: () => null,
          headerLeft: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.WalletSyncActivated}
        component={WalletSyncManage}
        options={{
          title: t("walletSync.title"),
          headerRight: () => null,
        }}
      />
    </Stack.Navigator>
  );
}
