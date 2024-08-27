import React from "react";
import { useTranslation } from "react-i18next";
import { ErrorComponent } from "../../components/Error";

interface Props {
  tryAgain: () => void;
}

export default function SyncError({ tryAgain }: Props) {
  const { t } = useTranslation();
  return (
    <ErrorComponent
      title={t("walletSync.synchronize.qrCode.pinCode.error.title")}
      desc={t("walletSync.synchronize.qrCode.pinCode.error.desc")}
      mainButton={{
        label: t("walletSync.synchronize.qrCode.pinCode.error.tryAgain"),
        onPress: tryAgain,
        outline: true,
      }}
    />
  );
}
