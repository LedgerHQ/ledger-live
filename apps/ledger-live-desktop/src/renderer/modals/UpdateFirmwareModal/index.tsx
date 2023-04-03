import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation, TFunction } from "react-i18next";
import { log } from "@ledgerhq/logs";
import { DeviceModelId } from "@ledgerhq/devices";
import { UserRefusedFirmwareUpdate } from "@ledgerhq/errors";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { hasFinalFirmware } from "@ledgerhq/live-common/hw/hasFinalFirmware";
import logger from "~/renderer/logger";
import Modal from "~/renderer/components/Modal";
import Stepper, { Step as TypedStep } from "~/renderer/components/Stepper";
import { ModalStatus } from "~/renderer/screens/manager/FirmwareUpdate/types";
import StepResetDevice, { StepResetFooter } from "./steps/00-step-reset-device";
import StepFullFirmwareInstall from "./steps/01-step-install-full-firmware";
import StepFlashMcu from "./steps/02-step-flash-mcu";
import StepDeviceLanguage from "./steps/02-step-device-language";
import StepUpdating from "./steps/02-step-updating";
import { isDeviceLocalizationSupported } from "@ledgerhq/live-common/manager/localization";
import StepConfirmation, { StepConfirmFooter } from "./steps/03-step-confirmation";

type MaybeError = Error | undefined | null;

export type StepProps = {
  firmware: FirmwareUpdateContext;
  appsToBeReinstalled: boolean;
  onCloseModal: (proceedToAppReinstall?: boolean) => void;
  error?: Error;
  setError: (e: Error) => void;
  device: Device;
  deviceModelId: DeviceModelId;
  deviceInfo: DeviceInfo;
  updatedDeviceInfo?: DeviceInfo;
  setUpdatedDeviceInfo: (d: DeviceInfo) => void;
  t: TFunction;
  transitionTo: (step: StepId) => void;
  onRetry: () => void;
};

export type StepId =
  | "idCheck"
  | "updateMCU"
  | "updating"
  | "finish"
  | "resetDevice"
  | "deviceLanguage";

type Step = TypedStep<StepId, StepProps>;

type Props = {
  withResetStep: boolean;
  withAppsToReinstall: boolean;
  status: ModalStatus;
  onClose: (proceedToAppReinstall?: boolean) => void;
  firmware?: FirmwareUpdateContext;
  stepId: StepId;
  error?: Error;
  deviceModelId: DeviceModelId;
  deviceInfo: DeviceInfo;
  setFirmwareUpdateOpened: (isOpen: boolean) => void;
};

const HookMountUnmount = ({ onMountUnmount }: { onMountUnmount: (m: boolean) => void }) => {
  useEffect(() => {
    onMountUnmount(true);
    return () => onMountUnmount(false);
  }, [onMountUnmount]);
  return null;
};

const UpdateModal = ({
  stepId,
  deviceModelId,
  withResetStep,
  withAppsToReinstall,
  error,
  status,
  onClose,
  firmware,
  setFirmwareUpdateOpened,
  ...props
}: Props) => {
  const [stateStepId, setStateStepId] = useState<StepId>(stepId);
  const [err, setErr] = useState<MaybeError>(error || null);
  const [updatedDeviceInfo, setUpdatedDeviceInfo] = useState<DeviceInfo | undefined>(undefined);
  const [nonce, setNonce] = useState(0);
  const { t } = useTranslation();
  const withFinal = useMemo(() => hasFinalFirmware(firmware?.final), [firmware]);
  const deviceLocalizationFeatureFlag = useFeature("deviceLocalization");

  const createSteps = useCallback(
    ({ withResetStep }: { withResetStep: boolean }) => {
      const updateStep: Step = {
        id: "idCheck",
        label: firmware?.osu?.hash ? t("manager.modal.identifier") : t("manager.modal.preparation"),
        component: StepFullFirmwareInstall,
        onBack: null,
        hideFooter: true,
      };

      const finalStep: Step = {
        id: "finish",
        label: t("addAccounts.breadcrumb.finish"),
        component: StepConfirmation,
        footer: StepConfirmFooter,
        onBack: null,
        hideFooter: false,
      };

      const mcuStep: Step = {
        id: "updateMCU",
        label: t("manager.modal.steps.updateMCU"),
        component: StepFlashMcu,
        onBack: null,
        hideFooter: true,
      };

      const deviceLanguageStep: Step = {
        id: "deviceLanguage",
        label: t("deviceLocalization.deviceLanguage"),
        component: StepDeviceLanguage,
        onBack: null,
        hideFooter: true,
      };

      const updatingStep: Step = {
        id: "updating",
        label: t("manager.modal.steps.updating"),
        component: StepUpdating,
        onBack: null,
        hideFooter: true,
      };

      const resetStep: Step = {
        id: "resetDevice",
        label: t("manager.modal.steps.reset"),
        component: StepResetDevice,
        footer: StepResetFooter,
        onBack: null,
        hideFooter: false,
      };

      const steps: Step[] = [];
      if (withResetStep) {
        steps.push(resetStep);
      }
      steps.push(updateStep);
      if (firmware?.shouldFlashMCU || withFinal) {
        steps.push(mcuStep);
      } else {
        steps.push(updatingStep);
      }

      if (
        firmware &&
        isDeviceLocalizationSupported(firmware.final.name, deviceModelId) &&
        deviceLocalizationFeatureFlag?.enabled
      ) {
        steps.push(deviceLanguageStep);
      }

      steps.push(finalStep);
      return steps;
    },
    [t, firmware, withFinal, deviceModelId, deviceLocalizationFeatureFlag],
  );

  const steps = useMemo(() => createSteps({ withResetStep }), [createSteps, withResetStep]);
  const stepsId = steps.map(step => step.id);
  const errorSteps = err ? [stepsId.indexOf(stateStepId)] : [];

  const setError = useCallback(
    (e: Error) => {
      logger.critical(e);
      setErr(e);
    },
    [setErr],
  );

  const handleReset = useCallback(() => {
    setErr(null);
    setStateStepId(steps[0].id);
    setNonce(curr => curr++);
  }, [steps]);

  const handleStepChange = useCallback((step: Step) => {
    setStateStepId(step.id);
  }, []);

  useEffect(() => {
    log("firmware-record-start");

    return () => {
      log("firmware-record-cancel");
    };
  }, []);

  const additionalProps = {
    ...props,
    appsToBeReinstalled: withAppsToReinstall,
    onCloseModal: onClose,
    setError,
    firmware,
    updatedDeviceInfo,
    setUpdatedDeviceInfo,
    error: err,
    deviceModelId,
    onRetry: handleReset,
  };

  return (
    <Modal
      width={550}
      onClose={() => onClose()}
      centered
      backdropColor
      onHide={handleReset}
      isOpened={status === "install"}
      refocusWhenChange={stateStepId}
      preventBackdropClick={!["finish", "resetDevice"].includes(stepId) && !error}
      render={() => (
        <Stepper
          {...additionalProps}
          key={nonce}
          onStepChange={handleStepChange}
          title={t("manager.firmware.update")}
          stepId={stateStepId}
          steps={steps}
          errorSteps={errorSteps}
          deviceModelId={deviceModelId}
          onClose={() => onClose()}
          hideCloseButton={
            stepId === "finish" && !!error && error instanceof UserRefusedFirmwareUpdate
          }
        >
          <HookMountUnmount onMountUnmount={setFirmwareUpdateOpened} />
        </Stepper>
      )}
    />
  );
};
export default UpdateModal;
