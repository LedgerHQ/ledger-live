import React from "react";
import { useTranslation } from "react-i18next";

import { InfoState } from "LLD/components/InfoState";

export function UnknownErrorState(): React.ReactNode {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="error"
      size="hug"
      title={t("deviceIntentExecutor.errors.intentError.title")}
      description={t("deviceIntentExecutor.errors.intentError.description")}
      testID="device-intent-executor-connect-device-unknown-error"
    />
  );
}
