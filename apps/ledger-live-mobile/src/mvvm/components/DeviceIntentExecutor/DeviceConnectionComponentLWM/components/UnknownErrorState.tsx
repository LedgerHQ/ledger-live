import React from "react";
import { InfoState } from "LLM/components/InfoState";
import { useTranslation } from "~/context/Locale";

/**
 * Rendered when the connect device use case escalates an unexpected error
 * (i.e. anything that escaped the inner state machine and was funneled into
 * the terminal `UnknownError` UI state). Wording is shared with the
 * executor's `IntentError` fallback because both represent the same
 * "this shouldn't have happened" category. No retry: the host chrome
 * provides the dismiss affordance.
 */
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
