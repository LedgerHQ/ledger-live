import React, { type ComponentProps } from "react";
import { OsUpdatesSteps } from "@ledgerhq/live-dmk-shared";
import type {
  ApplyUpdatesComponent,
  CreateBackupComponent,
  PreChecksComponent,
  RestoreBackupComponent,
} from "@ledgerhq/live-common/os-update/types";
import { OsUpdateStepLayout, type OsUpdateStepLayoutSpec } from "../../screens/OsUpdateStepLayout";
import {
  useFinishingProgress,
  type FinishingProgressResult,
  type FinishingProgressInput,
} from "../../hooks/useFinishingProgress";
import { useOsUpdateDevice, type OsUpdateDevice } from "../../hooks/useOsUpdateDevice";
import {
  getApplyUpdatesLayout,
  getApplyUpdatesProgress,
} from "../../screens/OsUpdateStepLayout/ApplyUpdates/getApplyUpdatesLayout";
import { getCreateBackupLayout } from "../../screens/OsUpdateStepLayout/CreateBackup/getCreateBackupLayout";
import { getPreChecksLayout } from "../../screens/OsUpdateStepLayout/PreChecks/getPreChecksLayout";
import {
  getRestoreBackupLayout,
  getRestoreBackupProgress,
} from "../../screens/OsUpdateStepLayout/RestoreBackup/getRestoreBackupLayout";

export type OsUpdateStepProps =
  | ComponentProps<PreChecksComponent>
  | ComponentProps<CreateBackupComponent>
  | ComponentProps<ApplyUpdatesComponent>
  | ComponentProps<RestoreBackupComponent>;

function getProgress(props: OsUpdateStepProps): FinishingProgressInput {
  switch (props.step) {
    case OsUpdatesSteps.APPLY_UPDATES:
      return getApplyUpdatesProgress(props.state);
    case OsUpdatesSteps.RESTORE_BACKUP:
      return getRestoreBackupProgress(props.state);
    case OsUpdatesSteps.PRE_CHECKS:
    case OsUpdatesSteps.CREATE_BACKUP:
      return { display: undefined, isDone: false };
    default: {
      const unhandled: never = props;
      return unhandled;
    }
  }
}

function getLayout(
  props: OsUpdateStepProps,
  device: OsUpdateDevice,
  { finishing, lastDisplay }: FinishingProgressResult,
): OsUpdateStepLayoutSpec {
  switch (props.step) {
    case OsUpdatesSteps.PRE_CHECKS:
      return getPreChecksLayout({ state: props.state, ...device });
    case OsUpdatesSteps.CREATE_BACKUP:
      return getCreateBackupLayout({ state: props.state, ...device });
    case OsUpdatesSteps.APPLY_UPDATES:
      return getApplyUpdatesLayout({
        state: props.state,
        finishing,
        lastDisplay,
        onClose: props.onUserClose,
        ...device,
      });
    case OsUpdatesSteps.RESTORE_BACKUP:
      return getRestoreBackupLayout({
        state: props.state,
        finishing,
        lastDisplay,
        onClose: props.onUserClose,
        ...device,
      });
    default: {
      const unhandled: never = props;
      return unhandled;
    }
  }
}

/**
 * Renders every step of the OS update workflow, and is meant to be injected for all of them.
 *
 * React remounts when the type of the rendered component changes, so injecting one component per
 * step would unmount the previous step, and with it its bottom sheet, which may still be open when
 * the orchestrator moves on. A single component keeps one navigation bar, one screen area and one
 * bottom sheet alive across the whole workflow, and only swaps what they display.
 */
export function OsUpdateStep(props: OsUpdateStepProps) {
  const device = useOsUpdateDevice(props.connectedDevice);
  const progress = useFinishingProgress(getProgress(props));
  const { screen, sheet } = getLayout(props, device, progress);

  return (
    <OsUpdateStepLayout
      screen={screen}
      sheet={sheet}
      onUserClose={props.onUserClose}
      isCloseConfirmationOpen={props.isCloseConfirmationOpen}
    />
  );
}
