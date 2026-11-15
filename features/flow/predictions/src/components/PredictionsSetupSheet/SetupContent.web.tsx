import React from "react";
import { useTranslation } from "@shared/i18n";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import { InfoState } from "@shared/ui-info-state";
import type { SetupContentProps } from "./PredictionsSetupSheet.types";
import { setupTitleKey } from "./setupTitleKey";

export function SetupContent({ outcome, onDismiss }: SetupContentProps) {
  const { t } = useTranslation();

  if (outcome === null) {
    return (
      <div
        // Same layout as the device intent executor's loading, which this dialog takes over from.
        className="flex w-full flex-col items-center gap-16 px-16 py-24"
        data-testid="predictions-setup-loading"
      >
        <Spinner size={32} />
        <h3 className="heading-4-semi-bold text-center text-base">{t(setupTitleKey(outcome))}</h3>
      </div>
    );
  }
  if (outcome.outcome === "failed") {
    return (
      <InfoState
        preset="error"
        size="hug"
        title={t(setupTitleKey(outcome))}
        description={t(`predictions.binding.setupFailed.${outcome.reason}`)}
        primaryCta={{ label: t("common.close"), onPress: onDismiss }}
        testID="predictions-setup-failed"
      />
    );
  }
  return (
    <InfoState
      preset="success"
      size="hug"
      title={t(setupTitleKey(outcome))}
      description={t("predictions.binding.setUp.description")}
      primaryCta={{ label: t("predictions.binding.setUp.continue"), onPress: onDismiss }}
      testID="predictions-setup-done"
    />
  );
}
