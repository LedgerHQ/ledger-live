import React from "react";
import { InfoState } from "@shared/ui-info-state";
import { useTranslation } from "~/context/Locale";

/**
 * Rendered for the terminal `UnknownError` UI state, when an unexpected error
 * escapes a connectivity use case. Wording is shared with the executor's
 * `IntentError` fallback because both represent the same "this shouldn't have
 * happened" category. No retry: the host chrome provides the dismiss affordance.
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
