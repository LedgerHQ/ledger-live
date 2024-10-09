import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";

import { NavigatorName, ScreenName } from "~/const";
import { useDispatch, useSelector } from "react-redux";
import { isFromLedgerSyncOnboardingSelector } from "~/reducers/settings";
import { setFromLedgerSyncOnboarding } from "~/actions/settings";
import { AnalyticsButton, AnalyticsFlow, AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { track } from "~/analytics";
import { setLedgerSyncActivateDrawer } from "~/actions/walletSync";
import { Steps } from "../../types/Activation";
import { useCurrentStep } from "../../hooks/useCurrentStep";
import { useClose } from "../../hooks/useClose";

type Props = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncSuccess>
>;

export function ActivationSuccess({ navigation, route }: Props) {
  const { t } = useTranslation();
  const isFromLedgerSyncOnboarding = useSelector(isFromLedgerSyncOnboardingSelector);
  const { created } = route.params;
  const title = created ? "walletSync.success.activation" : "walletSync.success.sync";
  const desc = created ? "" : "walletSync.success.syncDesc";
  const page = created ? AnalyticsPage.BackupCreationSuccess : AnalyticsPage.SyncSuccess;
  const dispatch = useDispatch();
  const { setCurrentStep } = useCurrentStep();

  const close = useClose();

  function onSyncAnother(): void {
    track("button_clicked", {
      button: AnalyticsButton.SyncWithAnotherLedgerLive,
      page,
      flow: AnalyticsFlow.LedgerSync,
    });
    if (isFromLedgerSyncOnboarding) {
      dispatch(setFromLedgerSyncOnboarding(false));
    }
    setCurrentStep(Steps.QrCodeMethod);
    navigation.navigate(NavigatorName.Settings, {
      screen: ScreenName.GeneralSettings,
    });
    dispatch(setLedgerSyncActivateDrawer(true));
  }

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
        label: t("walletSync.success.syncAnother"),
        onPress: onSyncAnother,
      }}
      secondaryButton={{
        label: t("walletSync.success.close"),
        onPress: onClose,
      }}
      analyticsPage={page}
    />
  );
}
