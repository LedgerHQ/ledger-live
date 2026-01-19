import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { AnalyticsButton, AnalyticsFlow, AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { track } from "~/analytics";
import { useClose } from "../../hooks/useClose";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

type Props = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncSuccess>
>;

export function ActivationSuccess({ route }: Props) {
  const { t } = useTranslation();
  const ledgerSyncOptimisationFlag = useFeature("lwmLedgerSyncOptimisation");
  const { created } = route.params;
  const title = ledgerSyncOptimisationFlag?.enabled
    ? "walletSync.success.complete.title"
    : created
      ? "walletSync.success.activation"
      : "walletSync.success.sync";
  const desc = ledgerSyncOptimisationFlag?.enabled
    ? "walletSync.success.complete.description"
    : created
      ? ""
      : "walletSync.success.syncDesc";
  const page = created ? AnalyticsPage.BackupCreationSuccess : AnalyticsPage.SyncSuccess;

  const close = useClose();

  function onClose(): void {
    track("button_clicked", {
      button: AnalyticsButton.Close,
      page,
      flow: AnalyticsFlow.LedgerSync,
    });
    close();
  }

  return (
    <Success
      title={t(title)}
      desc={t(desc)}
      mainButton={{
        label: t("walletSync.success.close"),
        onPress: onClose,
        testID: "walletsync-activation-success-close",
      }}
      analyticsPage={page}
    />
  );
}
