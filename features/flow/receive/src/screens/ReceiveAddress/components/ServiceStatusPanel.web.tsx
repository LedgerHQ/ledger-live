import React from "react";
import { WarningFill } from "@ledgerhq/lumen-ui-react/symbols";
import { InfoState } from "@shared/ui-info-state";
import { IncidentDescription } from "./IncidentDescription";
import type { ServiceStatusPanelProps } from "./ServiceStatusPanel.types";

export function ServiceStatusPanel({ serviceStatus }: ServiceStatusPanelProps) {
  return (
    <InfoState
      preset="spot"
      spotProps={{ icon: WarningFill, appearance: "warning" }}
      backgroundTone="error"
      size="hug"
      title={serviceStatus.title}
      description={
        serviceStatus.description && <IncidentDescription parts={serviceStatus.description} />
      }
      primaryCta={{
        label: serviceStatus.continueLabel,
        onPress: serviceStatus.onContinue,
        testID: "receive-address-service-status-continue",
      }}
      testID="receive-address-service-status"
    />
  );
}
