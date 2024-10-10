import { FirmwareUpdateContext } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/devices";
import StepResetDevice from "../steps/00-step-reset-device";
import StepPrepare from "../steps/01-step-prepare";
import StepFlashMcu from "../steps/02-step-flash-mcu";
import StepRestore from "../steps/02-step-restore";
import StepUpdating from "../steps/02-step-updating";
import StepConfirmation from "../steps/03-step-confirmation";
import { Step, StepId, STEPS } from "../types";
import { isDeviceLocalizationSupported } from "@ledgerhq/live-common/device/use-cases/isDeviceLocalizationSupported";
import { isCustomLockScreenSupported } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";

export function isRestoreStepEnabled(
  deviceModelId: DeviceModelId,
  firmware: FirmwareUpdateContext,
): boolean {
  return (
    isCustomLockScreenSupported(deviceModelId) ||
    isDeviceLocalizationSupported(firmware.final.name, deviceModelId)
  );
}

export const createFirmwareUpdateSteps = ({
  firmware,
  withFinal,
  withResetStep,
  deviceModelId,
  stateStepId,
}: {
  firmware: FirmwareUpdateContext;
  withFinal: boolean;
  withResetStep: boolean;
  deviceModelId: DeviceModelId;
  stateStepId: StepId;
}) => {
  const hasRestoreStep = isRestoreStepEnabled(deviceModelId, firmware);

  const restoreStepLabel =
    stateStepId === STEPS.FINISH
      ? "manager.modal.steps.restoreDone"
      : "manager.modal.steps.restore";

  const installUpdateLabel =
    stateStepId === STEPS.FINISH || stateStepId === STEPS.RESTORE
      ? "manager.modal.steps.installDone"
      : "manager.modal.steps.install";

  const resetStep: Step = {
    id: STEPS.RESET_DEVICE,
    label: "manager.modal.steps.reset",
    component: StepResetDevice,
    footer: StepResetDevice.Footer,
  };

  const prepareStep: Step = {
    id: STEPS.ID_CHECK,
    label: firmware?.osu?.hash
      ? "manager.modal.identifier"
      : stateStepId === STEPS.RESET_DEVICE || stateStepId === STEPS.ID_CHECK
        ? "manager.modal.steps.prepare"
        : "manager.modal.steps.prepareDone",
    component: StepPrepare,
  };

  const mcuStep: Step = {
    id: STEPS.UPDATE_MCU,
    label: installUpdateLabel,
    component: StepFlashMcu,
  };

  const updatingStep: Step = {
    id: STEPS.UPDATING,
    label: installUpdateLabel,
    component: StepUpdating,
  };

  const restoreStep: Step = {
    id: STEPS.RESTORE,
    label: restoreStepLabel,
    component: StepRestore,
    footer: StepRestore.Footer,
  };

  const finalStep: Step = {
    id: STEPS.FINISH,
    label: hasRestoreStep ? restoreStepLabel : installUpdateLabel,
    component: StepConfirmation,
    footer: StepConfirmation.Footer,
  };

  const steps: Step[] = [];
  if (withResetStep) {
    steps.push(resetStep);
  }
  steps.push(prepareStep);
  if (firmware?.shouldFlashMCU || withFinal) {
    steps.push(mcuStep);
  } else {
    steps.push(updatingStep);
  }

  if (hasRestoreStep) {
    steps.push(restoreStep);
  }

  steps.push(finalStep);
  return steps;
};
