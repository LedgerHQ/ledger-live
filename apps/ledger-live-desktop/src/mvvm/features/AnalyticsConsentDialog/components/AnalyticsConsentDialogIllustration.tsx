import React from "react";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { LedgerLogo, InformationFill } from "@ledgerhq/lumen-ui-react/symbols";
import type { AnalyticsConsentPhase } from "@features/flow-analytics-consent";

export type AnalyticsConsentDialogIllustrationProps = Readonly<{
  phase: AnalyticsConsentPhase;
}>;

export function AnalyticsConsentDialogIllustration({
  phase,
}: AnalyticsConsentDialogIllustrationProps) {
  if (phase === "privacy") {
    return <Spot appearance="muted" icon={InformationFill} size={72} />;
  }
  return <Spot icon={LedgerLogo} size={72} />;
}
