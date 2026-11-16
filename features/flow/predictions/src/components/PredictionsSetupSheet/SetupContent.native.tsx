import React from "react";
import { useTranslation } from "@shared/i18n";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { InfoState } from "@shared/ui-info-state";
import type { SetupContentProps } from "./PredictionsSetupSheet.types";
import { setupTitleKey } from "./setupTitleKey";

export function SetupContent({ outcome, onDismiss }: SetupContentProps) {
  const { t } = useTranslation();

  if (outcome === null) {
    return (
      <Box
        lx={{ alignItems: "center", gap: "s16", paddingTop: "s32", paddingBottom: "s56" }}
        testID="predictions-setup-loading"
      >
        <Spinner size={32} />
        <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t(setupTitleKey(outcome))}
        </Text>
      </Box>
    );
  }
  if (outcome.outcome === "failed") {
    return (
      <InfoState
        preset="error"
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
      title={t(setupTitleKey(outcome))}
      description={t("predictions.binding.setUp.description")}
      primaryCta={{ label: t("predictions.binding.setUp.continue"), onPress: onDismiss }}
      testID="predictions-setup-done"
    />
  );
}
