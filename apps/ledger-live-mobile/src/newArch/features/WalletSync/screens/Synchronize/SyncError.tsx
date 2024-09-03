import React from "react";
import { useTranslation } from "react-i18next";
import { ErrorComponent } from "../../components/Error/Simple";
import { AnalyticsButton, AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { track } from "~/analytics";

interface Props {
  tryAgain: () => void;
}

export default function SyncError({ tryAgain }: Props) {
  const { t } = useTranslation();

  const onTryAgain = () => {
    tryAgain();
    track("button_clicked", {
      button: AnalyticsButton.TryAgain,
      page: AnalyticsPage.PinCodesDoNotMatch,
    });
  };

  return (
    <ErrorComponent
      title={t("walletSync.synchronize.qrCode.pinCode.error.title")}
      desc={t("walletSync.synchronize.qrCode.pinCode.error.desc")}
      mainButton={{
        label: t("walletSync.synchronize.qrCode.pinCode.error.tryAgain"),
        onPress: onTryAgain,
        outline: true,
      }}
      analyticsPage={AnalyticsPage.PinCodesDoNotMatch}
    />
  );
}
