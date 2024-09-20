import React from "react";
import { useTranslation } from "react-i18next";
import { ErrorComponent } from "../../components/Error/Simple";
import { AnalyticsButton, AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { track } from "~/analytics";

interface Props {
  tryAgain: () => void;
}

export default function ScannedInvalidQrCode({ tryAgain }: Props) {
  const { t } = useTranslation();

  const onTryAgain = () => {
    tryAgain();
    track("button_clicked", {
      button: AnalyticsButton.Understand,
      page: AnalyticsPage.ScannedInvalidQrCode,
    });
  };

  return (
    <ErrorComponent
      title={t("walletSync.synchronize.qrCode.scannedInvalidQrCode.title")}
      desc={t("walletSync.synchronize.qrCode.scannedInvalidQrCode.desc")}
      info={t("walletSync.synchronize.qrCode.scannedInvalidQrCode.info")}
      mainButton={{
        label: t("walletSync.synchronize.qrCode.scannedInvalidQrCode.tryAgain"),
        onPress: onTryAgain,
        outline: false,
      }}
      analyticsPage={AnalyticsPage.ScannedInvalidQrCode}
    />
  );
}
