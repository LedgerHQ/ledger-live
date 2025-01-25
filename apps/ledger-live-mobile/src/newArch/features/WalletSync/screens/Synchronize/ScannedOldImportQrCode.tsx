import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { ErrorComponent } from "../../components/Error/Simple";
import { AnalyticsButton, AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { track } from "~/analytics";
import { Text } from "@ledgerhq/native-ui";
import { Linking } from "react-native";
import { urls } from "~/utils/urls";

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

  const openLink = () => {
    track("button_clicked", {
      button: AnalyticsButton.CheckoutArticle,
      page: AnalyticsPage.ScannedIncompatibleApps,
    });
    Linking.openURL(urls.updateLedgerLive);
  };

  const info = (
    <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center" mt={4}>
      <Trans
        i18nKey="walletSync.synchronize.qrCode.scannedOldQrCode.info"
        components={[
          <Text
            onPress={openLink}
            key="infoLink"
            variant="bodyLineHeight"
            color="neutral.c70"
            textAlign="center"
            style={{
              textDecorationLine: "underline",
            }}
          />,
        ]}
      />
    </Text>
  );

  return (
    <ErrorComponent
      title={t("walletSync.synchronize.qrCode.scannedOldQrCode.title")}
      desc={t("walletSync.synchronize.qrCode.scannedOldQrCode.desc")}
      info={info}
      mainButton={{
        label: t("walletSync.synchronize.qrCode.scannedOldQrCode.cta"),
        onPress: onTryAgain,
        outline: false,
      }}
      analyticsPage={AnalyticsPage.ScannedIncompatibleApps}
    />
  );
}
