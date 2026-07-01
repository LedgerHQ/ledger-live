import React from "react";
import { useTranslation } from "react-i18next";
import { LoadingContent } from "../../components/DeviceGenericStates/LoadingContent";

export function InstallingAppState() {
  const { t } = useTranslation();

  return (
    <LoadingContent
      title={t("deviceIntentExecutor.initialization.installingApp.title")}
      testID="device-initializer-installing-app"
    />
  );
}
