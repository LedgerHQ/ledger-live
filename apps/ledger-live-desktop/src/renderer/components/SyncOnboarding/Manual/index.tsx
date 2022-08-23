import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Flex, Text, VerticalTimeline } from "@ledgerhq/react-ui";
import { CloseMedium, HelpMedium } from "@ledgerhq/react-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { useGenuineCheck } from "@ledgerhq/live-common/hw/hooks/useGenuineCheck";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/hw/hooks/useGetLatestAvailableFirmware";
import { command } from "~/renderer/commands";
import LangSwitcher from "~/renderer/components/Onboarding/LangSwitcher";
import { useHistory, useRouteMatch } from "react-router-dom";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";

import nanoX from "~/renderer/images/nanoX.v3.svg";
import nanoXDark from "~/renderer/images/nanoXDark.v3.svg";
import Illustration from "~/renderer/components/Illustration";
import HelpDrawer from "./HelpDrawer";
import TroubleshootingDrawer from "./TroubleshootingDrawer";
import SoftwareCheckStep from "./SoftwareCheckStep";
import { DesyncOverlay } from "./DesyncOverlay";
import RecoveryContent from "./RecoveryContent";
import ApplicationContent from "./ApplicationContent";

const shortResyncDelay = 1000;
const longResyncDelay = 10000;
const readyRedirectDelay = 2500;
const pollingTimeoutMs = 60000;
const pollingPeriodMs = 1000;

// TODO: remove this and import it
enum DeviceOnboardingStep {
  WelcomeScreen = "WELCOME_SCREEN",
  SetupChoice = "SETUP_CHOICE",
  Pin = "PIN",
  NewDevice = "NEW_DEVICE",
  NewDeviceConfirming = "NEW_DEVICE_CONFIRMING",
  RestoreSeed = "RESTORE_SEED",
  SafetyWarning = "SAFETY WARNING",
  Ready = "READY",
}

enum StepKey {
  Paired = 0,
  Pin,
  Seed,
  SoftwareCheck,
  Applications,
  Ready,
  Exit,
}

type StepStatus = "completed" | "active" | "inactive";

type Step = {
  key: StepKey;
  status: StepStatus;
  title: string;
  estimatedTime?: number;
  renderBody?: () => ReactNode;
};

// The commands needs to be defined outside of the function component, to avoid creating it at
// each render, and re-triggering a run for their associated hooks
const getGenuineCheckFromDeviceIdCommand = command("getGenuineCheckFromDeviceId");
const getLatestAvailableFirmwareFromDeviceIdCommand = command("getLatestAvailableFirmwareFromDeviceId");
const getOnboardingStatePollingCommand = command("getOnboardingStatePolling");

function nextStepKey(step: StepKey): StepKey {
  if (step === StepKey.Exit) {
    return StepKey.Exit;
  }
  return step + 1;
}

const SyncOnboardingManual = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [stepKey, setStepKey] = useState<StepKey>(StepKey.Paired);

  const handleSoftwareCheckComplete = useCallback(() => {
    // TODO: put this line instead
    // setStepKey(nextStepKey(StepKey.SoftwareCheck));
    setStepKey(StepKey.Ready);
  }, []);

  const defaultSteps: Step[] = useMemo(
    () => [
      {
        key: StepKey.Paired,
        status: "active",
        title: "Nano is connected",
        renderBody: () => (
          <Text>
            {`Continue setup on Nano This screen will change dynamically to provide you with relevant information while you set up Nano`}
          </Text>
        ),
      },
      {
        key: StepKey.Pin,
        status: "inactive",
        title: "Set your PIN",
        renderBody: () => (
          <Text>
            {`Your PIN can be 4 to 8 digits long. Anyone with access to your Nano and to your PIN can also access all your crypto and NFT assets.`}
          </Text>
        ),
        estimatedTime: 120,
      },
      {
        key: StepKey.Seed,
        status: "inactive",
        title: t("syncOnboarding.manual.recoveryContent.title"),
        renderBody: () => <RecoveryContent />,
        estimatedTime: 300,
      },
      {
        key: StepKey.SoftwareCheck,
        status: "inactive",
        title: t("syncOnboarding.manual.softwareCheckContent.title"),
        renderBody: (isDisplayed?: boolean) => (
          <SoftwareCheckStep isDisplayed={isDisplayed} onComplete={handleSoftwareCheckComplete} />
        ),
      },
      {
        key: StepKey.Applications,
        status: "inactive",
        title: "Nano applications",
        /**
         * ApplicationContent contain the UI for
         * the install recommended apps step
         */
        renderBody: () => <ApplicationContent />,
      },
      {
        key: StepKey.Ready,
        status: "inactive",
        title: "Nano is ready",
      },
    ],
    [t, handleSoftwareCheckComplete],
  );

  const [steps, setSteps] = useState<Step[]>(defaultSteps);
  const [stopPolling, setStopPolling] = useState<boolean>(false);
  const [desyncTimer, setDesyncTimer] = useState<NodeJS.Timeout | null>(null);
  const device = useSelector(getCurrentDevice);

  const productName = device
    ? getDeviceModel(device.modelId).productName || device.modelId
    : "Ledger Device";
  const deviceName = device?.deviceName || productName;

  const {
    onboardingState: deviceOnboardingState,
    allowedError,
    fatalError,
  } = useOnboardingStatePolling({
    getOnboardingStatePolling: getOnboardingStatePollingCommand,
    device,
    pollingPeriodMs,
    stopPolling,
  });

  const deviceId = device?.deviceId ?? "";

  const { genuineState, devicePermissionState, error, resetGenuineCheckState } = useGenuineCheck({
    getGenuineCheckFromDeviceId: getGenuineCheckFromDeviceIdCommand,
    isHookEnabled: true,
    deviceId,
  });

  console.log(
    `🏴‍☠️🧙‍♂️: genuineState = ${genuineState}, devicePermissionState = ${devicePermissionState}, error = ${error}`,
  );

  // const { latestFirmware, error, status } = useGetLatestAvailableFirmware({
  //   getLatestAvailableFirmwareFromDeviceId: getLatestAvailableFirmwareFromDeviceIdCommand,
  //   isHookEnabled: true,
  //   deviceId,
  // });

  // console.log(`🏝: latestFirmware = ${latestFirmware}, status = ${status}, error = ${error}`);

  const [isHelpDrawerOpen, setHelpDrawerOpen] = useState<boolean>(false);
  const [isTroubleshootingDrawerOpen, setTroubleshootingDrawerOpen] = useState<boolean>(false);
  const [lastKnownDeviceId, setLastKnownDeviceId] = useState<DeviceModelId>(DeviceModelId.nanoX);

  const handleDeviceReady = useCallback(() => {
    history.push("/sync-onboarding/completion");
  }, [history]);

  const handleDesyncTimerRunsOut = useCallback(() => {
    setTroubleshootingDrawerOpen(true);
  }, []);

  useEffect(() => {
    if (device) {
      setLastKnownDeviceId(device.modelId);
    }
  }, [device]);

  useEffect(() => {
    if (deviceOnboardingState?.isOnboarded) {
      setStepKey(StepKey.SoftwareCheck);
      return;
    }

    switch (deviceOnboardingState?.currentOnboardingStep) {
      case DeviceOnboardingStep.RestoreSeed:
      case DeviceOnboardingStep.SafetyWarning:
      case DeviceOnboardingStep.NewDevice:
      case DeviceOnboardingStep.NewDeviceConfirming:
        setStepKey(StepKey.Seed);
        break;
      case DeviceOnboardingStep.WelcomeScreen:
      case DeviceOnboardingStep.SetupChoice:
        setStepKey(StepKey.Paired);
        break;
      case DeviceOnboardingStep.Pin:
        setStepKey(StepKey.Pin);
        break;
      default:
        break;
    }
  }, [deviceOnboardingState]);

  useEffect(() => {
    if (stepKey >= StepKey.SoftwareCheck) {
      setStopPolling(true);
    }

    if (stepKey === StepKey.Ready) {
      setTimeout(() => setStepKey(StepKey.Exit), readyRedirectDelay / 2);
    }

    if (stepKey === StepKey.Exit) {
      setTimeout(handleDeviceReady, readyRedirectDelay / 2);
    }

    setSteps(
      defaultSteps.map(step => {
        const stepStatus =
          step.key > stepKey ? "inactive" : step.key < stepKey ? "completed" : "active";

        return {
          ...step,
          status: stepStatus,
        };
      }),
    );
  }, [stepKey, defaultSteps, handleDeviceReady]);

  useEffect(() => {
    if (!fatalError) {
      return;
    }
    // TODO: handle fatal errors
    // setTroubleshootingDrawerOpen(true);
  }, [fatalError]);

  useEffect(() => {
    if (allowedError && !desyncTimer) {
      setDesyncTimer(setTimeout(handleDesyncTimerRunsOut, pollingTimeoutMs));
    } else if (!allowedError && desyncTimer) {
      clearTimeout(desyncTimer);
      setDesyncTimer(null);
    }
  }, [allowedError, handleDesyncTimerRunsOut, desyncTimer]);

  useEffect(() => {
    if (isTroubleshootingDrawerOpen) {
      setStopPolling(true);
    }
  }, [isTroubleshootingDrawerOpen]);

  return (
    <Flex bg="background.main" width="100%" height="100%" flexDirection="column">
      <DesyncOverlay isOpen={!!desyncTimer} delay={shortResyncDelay} />
      <HelpDrawer isOpen={isHelpDrawerOpen} onClose={() => setHelpDrawerOpen(false)} />
      <TroubleshootingDrawer
        lastKnownDeviceId={lastKnownDeviceId}
        isOpen={isTroubleshootingDrawerOpen}
        onClose={() => setTroubleshootingDrawerOpen(false)}
      />
      <Flex width="100%" justifyContent="flex-end" mt={4} px={4}>
        <LangSwitcher />
        <Button ml={4} Icon={CloseMedium} />
      </Flex>
      <Flex flex={1} px={8} py={4} alignItems="center">
        <Flex flex={1} flexDirection="column">
          <Flex alignItems="center" mb={8}>
            <Text variant="h4" fontSize="24px" fontWeight="semiBold">
              Setup Manual
            </Text>
            <Button
              ml={4}
              Icon={() => <HelpMedium color="neutral.c80" size={24} />}
              onClick={() => setHelpDrawerOpen(true)}
            />
          </Flex>
          <VerticalTimeline steps={steps} />
        </Flex>
        <Flex flex={1} justifyContent="center" alignItems="center">
          <Illustration
            style={{
              height: 540,
              width: 240,
              backgroundSize: "contain",
            }}
            lightSource={nanoX}
            darkSource={nanoXDark}
          />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default SyncOnboardingManual;
