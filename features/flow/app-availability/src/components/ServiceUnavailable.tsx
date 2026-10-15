import React from "react";
import { useTranslation } from "@shared/i18n";
import { AppUnavailable } from "@shared/ui-app-unavailable";

export function ServiceUnavailable({
  testID = "service-unavailable",
}: Readonly<{ testID?: string }>) {
  const { t } = useTranslation();

  return (
    <AppUnavailable
      title={t("serviceUnavailable.title")}
      description={t("serviceUnavailable.description")}
      testID={testID}
    />
  );
}
