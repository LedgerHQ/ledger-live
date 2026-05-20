import React from "react";
import { Trans } from "~/context/Locale";
import { LoadingContent } from "./LoadingContent";

export function InstallingAppState() {
  return (
    <LoadingContent
      title={<Trans i18nKey="deviceIntentExecutor.initialization.installingApp.title" />}
      testID="device-initializer-installing-app"
    />
  );
}
