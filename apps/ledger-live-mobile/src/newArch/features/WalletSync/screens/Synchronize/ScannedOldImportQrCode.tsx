import React from "react";
import { useTranslation } from "react-i18next";
import { ErrorComponent } from "../../components/Error/Simple";
import { AnalyticsButton, AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { track } from "~/analytics";

interface Props {
  tryAgain: () => void;
}

export default function ScannedOldImportQrCode({ tryAgain }: Props) {
  const { t } = useTranslation();

  const onTryAgain = () => {
    tryAgain();
    track("button_clicked", {
      button: AnalyticsButton.TryAgain,
      page: AnalyticsPage.ScannedIncompatibleApps,
    });
  };

  return (
    <ErrorComponent
      title={t("walletSync.synchronize.qrCode.scannedOldQrCode.title")}
      desc={t("walletSync.synchronize.qrCode.scannedOldQrCode.desc")}
      mainButton={{
        label: t("walletSync.synchronize.qrCode.scannedOldQrCode.tryAgain"),
        onPress: onTryAgain,
        outline: false,
      }}
      analyticsPage={AnalyticsPage.ScannedIncompatibleApps}
    />
  );
}
