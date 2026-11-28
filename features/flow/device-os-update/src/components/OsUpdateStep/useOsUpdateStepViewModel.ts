import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectOsUpdates } from "@domain/entity-device-os-update";
import { OsUpdatesSteps, type OsUpdateStepProps } from "@features/platform-device-os-update";
import {
  useFinishingProgress,
  type FinishingProgressInput,
  type FinishingProgressResult,
} from "../../hooks/useFinishingProgress";
import { useOsUpdateDevice, type OsUpdateDeviceView } from "../../hooks/useOsUpdateDevice";
import { useOsUpdateTracking } from "../../hooks/OsUpdateTrackingProvider";
import { getOsUpdateFlowStep, getPageEvent } from "../../analytics/getPageEvent";
import { OsUpdatePage } from "../../analytics/analyticsTypes";
import {
  getApplyUpdatesProgress,
  resolveApplyUpdatesStep,
} from "./descriptors/ApplyUpdates/resolveApplyUpdatesStep";
import { resolveCreateBackupStep } from "./descriptors/CreateBackup/resolveCreateBackupStep";
import { resolvePreChecksStep } from "./descriptors/PreChecks/resolvePreChecksStep";
import {
  getRestoreBackupProgress,
  resolveRestoreBackupStep,
} from "./descriptors/RestoreBackup/resolveRestoreBackupStep";
import type { OsUpdateStepDescriptor } from "../../types/OsUpdateStepDescriptor";
import type { TrackClick } from "../../types/TrackClick";

export type OsUpdateStepViewProps = OsUpdateStepDescriptor &
  Readonly<{
    device: OsUpdateDeviceView;
    onUserClose: () => void;
    isCloseConfirmationOpen: boolean;
  }>;

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

export function resolveOsUpdateStep(
  props: OsUpdateStepProps,
  progress: FinishingProgressResult,
  trackClick: TrackClick,
): OsUpdateStepDescriptor {
  switch (props.step) {
    case OsUpdatesSteps.PRE_CHECKS:
      return resolvePreChecksStep(props.state, trackClick);
    case OsUpdatesSteps.CREATE_BACKUP:
      return resolveCreateBackupStep(props.state, trackClick);
    case OsUpdatesSteps.APPLY_UPDATES:
      return resolveApplyUpdatesStep({
        state: props.state,
        progress,
        onClose: props.onUserClose,
        trackClick,
      });
    case OsUpdatesSteps.RESTORE_BACKUP:
      return resolveRestoreBackupStep({
        state: props.state,
        progress,
        onClose: props.onUserClose,
        trackClick,
      });
    default: {
      const unhandled: never = props;
      return unhandled;
    }
  }
}

/** Maps the orchestrator progress to the screen and sheet to show, and tracks its pages. */
export function useOsUpdateStepViewModel(props: OsUpdateStepProps): OsUpdateStepViewProps {
  const device = useOsUpdateDevice(props.connectedDevice);
  const progress = useFinishingProgress(getProgress(props));
  const osUpdates = useSelector(selectOsUpdates);
  const { trackPage, trackClick, trackCompleted } = useOsUpdateTracking();

  useEffect(() => {
    const pageEvent = getPageEvent(props, osUpdates);
    // Done while the bar still fills up: the outcome must not wait for the Success page.
    if (pageEvent?.page === OsUpdatePage.SUCCESS) trackCompleted(pageEvent);
    if (props.isCloseConfirmationOpen) {
      trackPage({ page: OsUpdatePage.CLOSE_CONFIRMATION, step: getOsUpdateFlowStep(props.step) });
      return;
    }
    if (progress.finishing) return;
    if (pageEvent) trackPage(pageEvent);
  }, [props, progress.finishing, osUpdates, trackPage, trackCompleted]);

  return {
    ...resolveOsUpdateStep(props, progress, trackClick),
    device,
    onUserClose: props.onUserClose,
    isCloseConfirmationOpen: props.isCloseConfirmationOpen,
  };
}
