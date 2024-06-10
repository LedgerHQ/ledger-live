import React from "react";
import SettingsRow from "~/components/SettingsRow";
import { useTranslation } from "react-i18next";

const WalletSyncRow = () => {
  const { t } = useTranslation();

  return (
    <SettingsRow
      event="WalletSyncSettingsRow"
      title={t("settings.display.walletSync")}
      desc={t("settings.display.walletSyncDesc")}
      arrowRight
      onPress={() => null}
      testID="wallet-sync-button"
    />
  );
};

export default WalletSyncRow;
