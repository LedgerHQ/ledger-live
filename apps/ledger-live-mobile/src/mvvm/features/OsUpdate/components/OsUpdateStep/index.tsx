import React from "react";
import { OsUpdateStepLayout } from "../../screens/OsUpdateStepLayout";
import { useOsUpdateStepViewModel, type OsUpdateStepProps } from "./useOsUpdateStepViewModel";

/**
 * Renders every step of the OS update workflow, and is meant to be injected for all of them.
 *
 * React remounts when the type of the rendered component changes, so injecting one component per
 * step would unmount the previous step, and with it its bottom sheet, which may still be open when
 * the orchestrator moves on. A single component keeps one navigation bar, one screen area and one
 * bottom sheet alive across the whole workflow, and only swaps what they display.
 */
export function OsUpdateStep(props: OsUpdateStepProps) {
  const { screen, sheet } = useOsUpdateStepViewModel(props);

  return (
    <OsUpdateStepLayout
      screen={screen}
      sheet={sheet}
      onUserClose={props.onUserClose}
      isCloseConfirmationOpen={props.isCloseConfirmationOpen}
    />
  );
}
