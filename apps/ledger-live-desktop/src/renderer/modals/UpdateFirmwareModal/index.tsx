import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { log } from "@ledgerhq/logs";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { hasFinalFirmware } from "@ledgerhq/live-common/hw/hasFinalFirmware";
import logger from "~/renderer/logger";
import StepResetDevice, { StepResetFooter } from "./steps/00-step-reset-device";
import StepPrepare from "./steps/01-step-prepare";
import StepFlashMcu from "./steps/02-step-flash-mcu";
import StepRestore from "./steps/02-step-restore";
import StepUpdating from "./steps/02-step-updating";
import { isDeviceLocalizationSupported } from "@ledgerhq/live-common/manager/localization";
import StepConfirmation, { StepConfirmFooter } from "./steps/03-step-confirmation";
import { Divider, Flex, FlowStepper, Text } from "@ledgerhq/react-ui";
import Disclaimer from "./Disclaimer";
import Cancel from "./errors/Cancel";
import DeviceCancel from "./errors/DeviceError";
import SideDrawerHeader from "~/renderer/components/SideDrawerHeader";

type MaybeError = Error | undefined | null;

export type StepProps = {
  firmware?: FirmwareUpdateContext;
  appsToBeReinstalled: boolean;
  onDrawerClose: (reinstall?: boolean) => void;
  error?: Error | null | undefined;
  setError: (e: Error | null) => void;
  CLSBackup?: string;
  deviceModelId: DeviceModelId;
  deviceInfo: DeviceInfo;
  updatedDeviceInfo?: DeviceInfo;
  setUpdatedDeviceInfo: (d: DeviceInfo) => void;
  transitionTo: (step: StepId) => void;
  onRetry: () => void;
  setCLSBackup: (hexImage: string) => void;

  completedRestoreSteps: string[];
  setCompletedRestoreSteps: (arg0: string[]) => void;
  currentRestoreStep: string;
  setCurrentRestoreStep: (arg0: string) => void;
  isLanguagePromptOpen: boolean;
  setIsLanguagePromptOpen: (arg0: boolean) => void;
  confirmedPrompt: boolean;
  setConfirmedPrompt: (arg0: boolean) => void;
  nonce: number;
  setNonce: (arg0: number) => void;
  setFirmwareUpdateCompleted: (arg0: boolean) => void;

  finalStepSuccessDescription?: string;
  finalStepSuccessButtonLabel?: string;
  finalStepSuccessButtonOnClick?: () => void;
  shouldReloadManagerOnCloseIfUpdateRefused?: boolean;
  deviceHasPin?: boolean;
};

export type StepId = "resetDevice" | "idCheck" | "updateMCU" | "updating" | "restore" | "finish";

export type Props = {
  withResetStep: boolean;
  withAppsToReinstall: boolean;
  onDrawerClose: (reinstall?: boolean) => void;
  onRequestClose: () => void;
  firmware?: FirmwareUpdateContext;
  stepId: StepId;
  error?: Error | null | undefined;
  deviceModelId: DeviceModelId;
  deviceInfo: DeviceInfo;
  setFirmwareUpdateCompleted: (completed: boolean) => void;
  // This is bad practice but it seems to be needed since we spread additional props in the stepper and down below…
  [key: string]: unknown;
};

type Step = {
  id: StepId;
  label: string;
  component: React.FunctionComponent<StepProps>;
  footer?: React.FunctionComponent<StepProps>;
};

const UpdateModal = ({
  stepId,
  deviceModelId,
  withResetStep,
  withAppsToReinstall,
  error,
  onDrawerClose,
  onRequestClose,
  setFirmwareUpdateCompleted,
  firmware,
  ...props
}: Props) => {
  const { t } = useTranslation();
  const [stateStepId, setStateStepId] = useState<StepId>(stepId);
  const [completedRestoreSteps, setCompletedRestoreSteps] = useState<string[]>([]);
  const [isLanguagePromptOpen, setIsLanguagePromptOpen] = useState<boolean>(false);
  const [confirmedPrompt, setConfirmedPrompt] = useState<boolean>(false);
  const [currentRestoreStep, setCurrentRestoreStep] = useState<string>("");
  const [nonce, setNonce] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [err, setErr] = useState<MaybeError>(error || null);
  const [CLSBackup, setCLSBackup] = useState<string>();
  const [updatedDeviceInfo, setUpdatedDeviceInfo] = useState<DeviceInfo | undefined>(undefined);
  const withFinal = useMemo(() => hasFinalFirmware(firmware?.final), [firmware]);
  const [cancel, setCancel] = useState<boolean>(false);

  const onRequestCancel = useCallback(() => {
    showDisclaimer || stateStepId === "finish" ? onRequestClose() : setCancel(state => !state);
  }, [showDisclaimer, stateStepId, onRequestClose]);

  const createSteps = useCallback(
    ({ withResetStep }: { withResetStep: boolean }) => {
      const hasRestoreStep =
        firmware && isDeviceLocalizationSupported(firmware.final.name, deviceModelId);
      const restoreStepLabel = t("manager.modal.steps.restore");
      const installUpdateLabel =
        stateStepId === "finish"
          ? t("manager.modal.steps.installDone")
          : t("manager.modal.steps.install");

      const resetStep: Step = {
        id: "resetDevice",
        label: t("manager.modal.steps.reset"),
        component: StepResetDevice,
        footer: StepResetFooter,
      };

      const prepareStep: Step = {
        id: "idCheck",
        label: firmware?.osu?.hash
          ? t("manager.modal.identifier")
          : stateStepId === "resetDevice" || stateStepId === "idCheck"
          ? t("manager.modal.steps.prepare")
          : t("manager.modal.steps.prepareDone"),
        component: StepPrepare,
      };

      const mcuStep: Step = {
        id: "updateMCU",
        label: installUpdateLabel,
        component: StepFlashMcu,
      };

      const updatingStep: Step = {
        id: "updating",
        label: installUpdateLabel,
        component: StepUpdating,
      };

      const restoreStep: Step = {
        id: "restore",
        label: restoreStepLabel,
        component: StepRestore,
      };

      const finalStep: Step = {
        id: "finish",
        label: hasRestoreStep ? restoreStepLabel : installUpdateLabel,
        component: StepConfirmation,
        footer: StepConfirmFooter,
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
    },
    [t, firmware, withFinal, deviceModelId, stateStepId],
  );

  const steps = useMemo(() => createSteps({ withResetStep }), [createSteps, withResetStep]);

  const setError = useCallback(
    (e: Error | null) => {
      logger.critical(e);
      setErr(e);
    },
    [setErr],
  );

  const handleReset = useCallback(
    (isRetry?: boolean) => {
      !isRetry && setStateStepId(steps[0].id);
      setNonce(curr => curr++);
      setErr(null);
    },
    [steps],
  );

  const onSkip = useCallback(() => {
    setCompletedRestoreSteps([...completedRestoreSteps, currentRestoreStep]);
    setError(null);
  }, [completedRestoreSteps, currentRestoreStep, setCompletedRestoreSteps, setError]);

  useEffect(() => {
    log("firmware-record-start");

    return () => {
      log("firmware-record-cancel");
    };
  }, []);

  const additionalProps = {
    ...props,
    onDrawerClose,
    onRetry: handleReset,

    setError,
    setCLSBackup,
    setUpdatedDeviceInfo,

    appsToBeReinstalled: withAppsToReinstall,
    transitionTo: setStateStepId,
    CLSBackup,
    deviceModelId,
    error: err,
    firmware,
    updatedDeviceInfo,
    t,

    completedRestoreSteps,
    setCompletedRestoreSteps,
    currentRestoreStep,
    setCurrentRestoreStep,
    nonce,
    setNonce,
    setFirmwareUpdateCompleted,
    isLanguagePromptOpen,
    setIsLanguagePromptOpen,
    confirmedPrompt,
    setConfirmedPrompt,
    deviceHasPin: !(deviceModelId === DeviceModelId.stax && !props.deviceInfo?.onboarded),
  };

  const getMainContent = () => {
    if (err) {
      return (
        <DeviceCancel
          error={err}
          shouldReloadManagerOnCloseIfUpdateRefused={
            !!props.shouldReloadManagerOnCloseIfUpdateRefused
          }
          onDrawerClose={onDrawerClose}
          onRetry={handleReset}
          onSkip={onSkip}
        />
      );
    } else if (cancel) {
      return <Cancel onContinue={onRequestCancel} onCancel={onRequestClose} />;
    } else if (showDisclaimer) {
      return <Disclaimer onContinue={() => setShowDisclaimer(false)} t={t} firmware={firmware} />;
    } else {
      return (
        <FlowStepper.Indexed
          activeKey={stateStepId}
          extraStepperContainerProps={{ px: 12, mb: 0 }}
          extraStepperProps={{
            errored: !!error,
            filterDuplicate: true,
            isOver: stateStepId === "finish",
          }}
          extraContainerProps={{ overflowY: "hidden" }}
          extraChildrenContainerProps={{ overflowY: "hidden" }}
          renderChildren={undefined}
        >
          {steps.map(step => (
            <FlowStepper.Indexed.Step key={step.id} itemKey={step.id} label={step.label as string}>
              <Flex
                flex={1}
                flexDirection="column"
                justifyContent="space-between"
                overflowY="hidden"
              >
                <Flex
                  flex={1}
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="stretch"
                  flexShrink={1}
                  overflowY="hidden"
                  px={12}
                >
                  <step.component {...additionalProps} />
                </Flex>
                {step.footer ? (
                  <Flex flexDirection="column" alignSelf="stretch">
                    <Divider color={"neutral.c30"} />
                    <Flex
                      flex={1}
                      px={12}
                      alignSelf="stretch"
                      flexDirection="row"
                      justifyContent="space-between"
                      pt={6}
                      pb={1}
                    >
                      <step.footer {...additionalProps} />
                    </Flex>
                  </Flex>
                ) : null}
              </Flex>
            </FlowStepper.Indexed.Step>
          ))}
        </FlowStepper.Indexed>
      );
    }
  };

  const deviceModel = getDeviceModel(deviceModelId);

  return (
    <Flex
      key={`${nonce}_fwUpdate`}
      flexDirection="column"
      rowGap={5}
      height="100%"
      overflowY="hidden"
      width="100%"
      flex={1}
      data-test-id="firmware-update-container"
    >
      <SideDrawerHeader onRequestClose={onRequestCancel} />
      <Text alignSelf="center" variant="h5Inter">
        {t("manager.modal.title", { productName: deviceModel.productName })}
      </Text>
      {getMainContent()}
    </Flex>
  );
};

export default withV3StyleProvider(UpdateModal);
