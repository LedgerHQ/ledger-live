import React, { useCallback } from "react";
import SettingsRow from "~/components/SettingsRow";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import {
  useWalletSyncAnalytics,
  AnalyticsPage,
  AnalyticsButton,
} from "LLM/features/WalletSync/hooks/useWalletSyncAnalytics";

const WalletSyncRow = () => {
  const { t } = useTranslation();
  const { onClickTrack } = useWalletSyncAnalytics();
  const navigation = useNavigation();

  const navigateToWalletSyncActivationScreen = useCallback(() => {
    onClickTrack({ button: AnalyticsButton.LedgerSync, page: AnalyticsPage.SettingsGeneral });
    navigation.navigate(ScreenName.WalletSyncActivationSettings);
  }, [navigation, onClickTrack]);

  return (
    <SettingsRow
      event="WalletSyncSettingsRow"
      title={t("settings.display.walletSync")}
      desc={t("settings.display.walletSyncDesc")}
      arrowRight
      onPress={navigateToWalletSyncActivationScreen}
      testID="wallet-sync-button"
    />
  );
};

export default WalletSyncRow;
