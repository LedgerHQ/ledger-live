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
import { WalletSyncManageKeyDeletionSuccess } from "./screens/ManageKey/DeletionSuccess";
import { ManageInstancesProcess } from "./screens/ManageInstances/ManageInstancesProcess";
import { WalletSyncManageInstanceDeletionSuccess } from "./screens/ManageInstances/DeletionSuccess";

const Stack = createStackNavigator<WalletSyncNavigatorStackParamList>();

export default function WalletSyncNavigator() {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);
  const { t } = useTranslation();
  useInitMemberCredentials();

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.WalletSyncActivationInit}
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

      <Stack.Screen
        name={ScreenName.WalletSyncManageKeyDeleteSuccess}
        component={WalletSyncManageKeyDeletionSuccess}
        options={{
          title: "",
          headerRight: () => null,
          headerLeft: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.WalletSyncManageInstancesProcess}
        component={ManageInstancesProcess}
        options={{
          title: "",
          headerRight: () => null,
        }}
      />

      <Stack.Screen
        name={ScreenName.WalletSyncManageInstancesSuccess}
        component={WalletSyncManageInstanceDeletionSuccess}
        options={{
          title: "",
          headerRight: () => null,
          headerLeft: () => null,
        }}
      />
    </Stack.Navigator>
  );
}
