import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";

import { NavigatorName, ScreenName } from "~/const";

type Props = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncSuccess>
>;

export function ActivationSuccess({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { created } = route.params;
  const title = created ? "walletSync.success.activation" : "walletSync.success.sync";
  const desc = created ? "walletSync.success.activationDesc" : "walletSync.success.syncDesc";

  function syncAnother(): void {
    console.log("syncAnother");
    navigation.navigate(ScreenName.WalletSyncActivationProcess);
  }

  function close(): void {
    navigation.navigate(NavigatorName.Settings, {
      screen: ScreenName.GeneralSettings,
    });
  }

  return (
    <Success
      title={t(title)}
      desc={t(desc)}
      mainButton={{
        label: t("walletSync.success.syncAnother"),
        onPress: syncAnother,
      }}
      secondaryButton={{
        label: t("walletSync.success.close"),
        onPress: close,
      }}
    />
  );
}
