import React from "react";
import { Trans } from "~/context/Locale";
import { LoadingContent } from "./LoadingContent";

export function LoadingState() {
  return (
    <LoadingContent
      title={<Trans i18nKey="deviceIntentExecutor.initialization.loading.title" />}
      testID="device-initializer-loading"
    />
  );
}
