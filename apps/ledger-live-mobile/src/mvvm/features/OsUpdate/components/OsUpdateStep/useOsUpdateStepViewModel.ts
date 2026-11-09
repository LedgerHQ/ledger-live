import { useEffect, type ComponentProps } from "react";
import { OsUpdatesSteps } from "@ledgerhq/live-dmk-shared";
import type {
  ApplyUpdatesComponent,
  CreateBackupComponent,
  PreChecksComponent,
  RestoreBackupComponent,
} from "@ledgerhq/live-common/os-update/types";
import type { OsUpdateStepLayoutSpec } from "../../screens/OsUpdateStepLayout";
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
import { useSelector } from "~/context/hooks";
import { osUpdatesSelector } from "../../state/osUpdateSlice";
import { useOsUpdateTracking } from "../../analytics/TrackingProvider";
import { getOsUpdateFlowStep, getPageEvent } from "../../analytics/getPageEvent";
import { OsUpdateButton, OsUpdatePage } from "../../analytics/types";

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
  trackClick: (button: OsUpdateButton) => void,
): OsUpdateStepLayoutSpec {
  switch (props.step) {
    case OsUpdatesSteps.PRE_CHECKS:
      return getPreChecksLayout({ state: props.state, trackClick, ...device });
    case OsUpdatesSteps.CREATE_BACKUP:
      return getCreateBackupLayout({ state: props.state, trackClick, ...device });
    case OsUpdatesSteps.APPLY_UPDATES:
      return getApplyUpdatesLayout({
        state: props.state,
        finishing,
        lastDisplay,
        onClose: props.onUserClose,
        trackClick,
        ...device,
      });
    case OsUpdatesSteps.RESTORE_BACKUP:
      return getRestoreBackupLayout({
        state: props.state,
        finishing,
        lastDisplay,
        onClose: props.onUserClose,
        trackClick,
        ...device,
      });
    default: {
      const unhandled: never = props;
      return unhandled;
    }
  }
}

export function useOsUpdateStepViewModel(props: OsUpdateStepProps): OsUpdateStepLayoutSpec {
  const device = useOsUpdateDevice(props.connectedDevice);
  const progress = useFinishingProgress(getProgress(props));
  const osUpdates = useSelector(osUpdatesSelector);
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

  return getLayout(props, device, progress, trackClick);
}
