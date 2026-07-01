import React from "react";
import { useTranslation } from "react-i18next";
import { LoadingContent } from "../../components/DeviceGenericStates/LoadingContent";

export function LoadingState() {
  const { t } = useTranslation();

  return (
    <LoadingContent
      title={t("deviceIntentExecutor.initialization.loading.title")}
      testID="device-initializer-loading"
    />
  );
}
