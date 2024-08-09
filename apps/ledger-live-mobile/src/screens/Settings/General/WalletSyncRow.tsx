import React, { useCallback } from "react";
import SettingsRow from "~/components/SettingsRow";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import {
  useWalletSyncAnalytics,
  AnalyticsPage,
  AnalyticsButton,
} from "LLM/features/WalletSync/hooks/useWalletSyncAnalytics";
import { useSelector } from "react-redux";
import { trustchainSelector } from "@ledgerhq/trustchain/store";

const WalletSyncRow = () => {
  const { t } = useTranslation();
  const { onClickTrack } = useWalletSyncAnalytics();
  const navigation = useNavigation();

  const trustchain = useSelector(trustchainSelector);

  const navigateToWalletSyncActivationScreen = useCallback(() => {
    // Here we need to check if the user has a backup or not to determine the screen to navigate to
    onClickTrack({ button: AnalyticsButton.LedgerSync, page: AnalyticsPage.SettingsGeneral });

    if (trustchain?.rootId) {
      navigation.navigate(NavigatorName.WalletSync, {
        screen: ScreenName.WalletSyncActivated,
      });
    } else {
      navigation.navigate(NavigatorName.WalletSync, {
        screen: ScreenName.WalletSyncActivationInit,
      });
    }
  }, [navigation, onClickTrack, trustchain?.rootId]);

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
