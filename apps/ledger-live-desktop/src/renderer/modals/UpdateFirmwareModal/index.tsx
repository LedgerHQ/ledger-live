import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { log } from "@ledgerhq/logs";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { hasFinalFirmware } from "@ledgerhq/live-common/hw/hasFinalFirmware";
import logger from "~/renderer/logger";
import { Divider, Flex, FlowStepper, Text } from "@ledgerhq/react-ui";
import Disclaimer from "./Disclaimer";
import Cancel from "./errors/Cancel";
import DeviceCancel from "./errors/DeviceError";
import { DisconnectedDevice, DisconnectedDeviceDuringOperation } from "@ledgerhq/errors";
import SideDrawerHeader from "~/renderer/components/SideDrawerHeader";
import { createFirmwareUpdateSteps } from "./helpers/createFirmwareUpdateSteps";
import { StepId, STEPS } from "./types";

type MaybeError = Error | undefined | null;

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

  const isDisconnectedDeviceError = err instanceof DisconnectedDevice;
  const isDisconnectedDeviceDuringOperationError = err instanceof DisconnectedDeviceDuringOperation;
  const isDeviceDisconnected =
    isDisconnectedDeviceError || isDisconnectedDeviceDuringOperationError;

  const onRequestCancel = useCallback(() => {
    (showDisclaimer && !isDeviceDisconnected) || stateStepId === STEPS.FINISH || cancel
      ? onRequestClose()
      : setCancel(true);
  }, [cancel, showDisclaimer, isDeviceDisconnected, stateStepId, onRequestClose]);

  const steps = useMemo(
    () =>
      createFirmwareUpdateSteps({ firmware, withFinal, withResetStep, deviceModelId, stateStepId }),
    [firmware, withFinal, withResetStep, deviceModelId, stateStepId],
  );

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

  const onContinue = useCallback(() => {
    setCancel(false);
    handleReset();
  }, [handleReset]);

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
    if (err && !isDeviceDisconnected) {
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
    } else if (cancel || isDeviceDisconnected) {
      return <Cancel onContinue={onContinue} onCancel={onRequestClose} />;
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
            isOver: stateStepId === STEPS.FINISH,
          }}
          extraContainerProps={{ overflowY: "hidden" }}
          extraChildrenContainerProps={{ overflowY: "hidden" }}
          renderChildren={undefined}
        >
          {steps.map(step => (
            <FlowStepper.Indexed.Step
              key={step.id}
              itemKey={step.id}
              label={t(step.label) as string}
            >
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
