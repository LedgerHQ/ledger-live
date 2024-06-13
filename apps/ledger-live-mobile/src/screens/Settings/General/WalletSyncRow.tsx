import React, { useCallback } from "react";
import SettingsRow from "~/components/SettingsRow";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";

const WalletSyncRow = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const navigateToWalletSyncActivationScreen = useCallback(() => {
    // We need to check if the user already have a backup activated
    navigation.navigate(ScreenName.WalletSyncActivationSettings);
  }, [navigation]);

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
