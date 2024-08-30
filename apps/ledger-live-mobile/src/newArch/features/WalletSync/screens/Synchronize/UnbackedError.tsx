import React from "react";
import { useTranslation } from "react-i18next";
import { ErrorComponent } from "../../components/Error/Simple";

interface Props {
  create: () => void;
}

export default function UnbackedError({ create }: Props) {
  const { t } = useTranslation();
  return (
    <ErrorComponent
      title={t("walletSync.synchronize.qrCode.unbacked.title")}
      desc={t("walletSync.synchronize.qrCode.unbacked.desc")}
      mainButton={{
        label: t("walletSync.synchronize.qrCode.unbacked.cta"),
        onPress: create,
        outline: false,
      }}
    />
  );
}
