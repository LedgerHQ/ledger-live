import React from "react";
import { OsUpdateStepLayout } from "../StepLayout/OsUpdateStepLayout";
import type { OsUpdateStepProps } from "@features/platform-device-os-update";
import { OsUpdateScreenView } from "./OsUpdateScreenView";
import { OsUpdateSheetView, isSheetHeaderHidden } from "./OsUpdateSheetView";
import { useOsUpdateStepViewModel } from "./useOsUpdateStepViewModel";

/**
 * Renders every step of the OS update workflow.
 *
 * React remounts when the type of the rendered component changes, so one component per step would
 * unmount the previous step, and with it its bottom sheet, which may still be open when the
 * orchestrator moves on. A single component keeps one navigation bar, one screen area and one bottom
 * sheet alive across the whole workflow, and only swaps what they display.
 */
export function OsUpdateStep(props: OsUpdateStepProps) {
  const { screen, sheet, device, onUserClose, isCloseConfirmationOpen } =
    useOsUpdateStepViewModel(props);

  return (
    <OsUpdateStepLayout
      screen={<OsUpdateScreenView screen={screen} device={device} />}
      sheet={
        sheet && {
          content: <OsUpdateSheetView sheet={sheet} device={device} />,
          hideHeader: isSheetHeaderHidden(sheet),
        }
      }
      onUserClose={onUserClose}
      isCloseConfirmationOpen={isCloseConfirmationOpen}
    />
  );
}
