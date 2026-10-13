import React from "react";
import { useTranslation } from "react-i18next";
import { LoadingContent } from "../../components/DeviceGenericStates/LoadingContent";

export function LoadingState(): React.ReactNode {
  const { t } = useTranslation();

  return <LoadingContent title={t("deviceIntentExecutor.connectDevice.states.loading.title")} />;
}
