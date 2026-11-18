import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { OsUpdateTrackingProvider } from "../../hooks/OsUpdateTrackingProvider";
import { OsUpdatesOrchestrator } from "@features/platform-device-os-update";
import { OsUpdateStep } from "../../components/OsUpdateStep/OsUpdateStep";
import { CloseConfirmation } from "../../components/CloseConfirmation/CloseConfirmation";
import { usePreventHardwareBack } from "../../hooks/usePreventHardwareBack";
import { WhatsNewScreen } from "../WhatsNew/WhatsNewScreen";
import type { OsUpdateFlowViewProps } from "./useOsUpdateFlowViewModel";

export function OsUpdateFlowView({
  whatsNew,
  orchestratorRun,
  onConfirmStart,
  onOpenReleaseNotes,
  onClose,
  analytics,
}: Readonly<OsUpdateFlowViewProps>) {
  usePreventHardwareBack(orchestratorRun !== null);

  const content = (() => {
    if (orchestratorRun) {
      return (
        <Box lx={{ flex: 1 }}>
          <OsUpdatesOrchestrator
            {...orchestratorRun}
            renderStep={props => <OsUpdateStep {...props} />}
            renderCloseConfirmation={props => <CloseConfirmation {...props} />}
          />
        </Box>
      );
    }

    if (whatsNew) {
      return (
        <WhatsNewScreen
          version={whatsNew.version}
          notes={whatsNew.notes}
          onOpenReleaseNotes={onOpenReleaseNotes}
          onStart={onConfirmStart}
          onClose={onClose}
        />
      );
    }

    return null;
  })();

  if (!analytics) return content;
  return <OsUpdateTrackingProvider {...analytics}>{content}</OsUpdateTrackingProvider>;
}
