import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";

import { NavigatorName, ScreenName } from "~/const";
import { AnalyticsButton, AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { track } from "~/analytics";

type Props = BaseComposite<
  StackNavigatorProps<
    WalletSyncNavigatorStackParamList,
    ScreenName.WalletSyncManageInstancesSuccess
  >
>;

export function WalletSyncManageInstanceDeletionSuccess({ navigation, route }: Props) {
  const { t } = useTranslation();
  const member = route.params?.member.name;
  function close(): void {
    track("button_clicked", {
      button: AnalyticsButton.Close,
      page: AnalyticsPage.RemoveInstanceSuccess,
    });
    navigation.navigate(NavigatorName.Settings, {
      screen: ScreenName.GeneralSettings,
    });
  }

  return (
    <Success
      title={t("walletSync.walletSyncActivated.synchronizedInstances.success", {
        member,
      })}
      secondaryButton={{
        label: t("walletSync.success.close"),
        onPress: close,
      }}
      analyticsPage={AnalyticsPage.RemoveInstanceSuccess}
    />
  );
}
