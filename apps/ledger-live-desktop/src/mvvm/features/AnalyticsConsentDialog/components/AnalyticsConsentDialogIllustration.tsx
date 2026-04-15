import React from "react";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import type { AnalyticsConsentPhase } from "@ledgerhq/live-common/analyticsConsentUtils";

export type AnalyticsConsentDialogIllustrationProps = Readonly<{
  phase: AnalyticsConsentPhase;
}>;

export function AnalyticsConsentDialogIllustration({
  phase,
}: AnalyticsConsentDialogIllustrationProps) {
  if (phase === "privacy") {
    return <Spot appearance="info" size={72} />;
  }
  return <Spot appearance="icon" icon={LedgerLogo} size={72} />;
}
