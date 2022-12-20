import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Flex, Text, VerticalTimeline } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { useTheme } from "styled-components";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import {
  OnboardingStep as DeviceOnboardingStep,
  fromSeedPhraseTypeToNbOfSeedWords,
} from "@ledgerhq/live-common/hw/extractOnboardingState";

import { command } from "~/renderer/commands";
import { useHistory } from "react-router-dom";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import HelpDrawer from "./HelpDrawer";
import TroubleshootingDrawer from "./TroubleshootingDrawer";
import SoftwareCheckStep from "./SoftwareCheckStep";
import { DesyncOverlay } from "./DesyncOverlay";
import RecoveryContent from "./RecoveryContent";
import ApplicationContent from "./ApplicationContent";
import { StepText } from "./shared";
import Header from "./Header";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "../../DeviceAction/animations";
import DeviceIllustration from "../../DeviceIllustration";

const readyRedirectDelayMs = 2500;
const pollingPeriodMs = 1000;
const desyncTimeoutMs = 60000;
const longDesyncTimeoutMs = 100000;
const resyncDelayMs = 1000;
const longResyncDelayMs = 30000;

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

const getOnboardingStatePollingCommand = command("getOnboardingStatePolling");

function nextStepKey(step: StepKey): StepKey {
  if (step === StepKey.Exit) {
    return StepKey.Exit;
  }
  return step + 1;
}

const SyncOnboardingManual = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const history = useHistory();
  const [stepKey, setStepKey] = useState<StepKey>(StepKey.Paired);
  const device = useSelector(getCurrentDevice);

  const productName = device
    ? getDeviceModel(device.modelId).productName || device.modelId
    : "Ledger Device";
  const deviceName = device?.deviceName || productName;

  const handleSoftwareCheckComplete = useCallback(() => {
    setStepKey(nextStepKey(StepKey.SoftwareCheck));
  }, []);

  const handleInstallRecommendedApplicationComplete = useCallback(() => {
    setStepKey(nextStepKey(StepKey.Applications));
  }, []);

  const defaultSteps: Step[] = useMemo(
    () => [
      {
        key: StepKey.Paired,
        status: "active",
        title: t("syncOnboarding.manual.pairedContent.title", {
          deviceName: productName,
        }),
        renderBody: () => (
          <Flex flexDirection="column">
            <StepText mb={6}>
              {t("syncOnboarding.manual.pairedContent.description", {
                deviceName: productName,
              })}
            </StepText>
            <StepText>
              {t("syncOnboarding.manual.pairedContent.text", {
                deviceName: productName,
              })}
            </StepText>
          </Flex>
        ),
      },
      {
        key: StepKey.Pin,
        status: "inactive",
        title: t("syncOnboarding.manual.pinContent.title"),
        renderBody: () => (
          <Flex flexDirection="column">
            <StepText mb={6}>{t("syncOnboarding.manual.pinContent.description")}</StepText>
            <StepText>
              {t("syncOnboarding.manual.pinContent.text", {
                deviceName: productName,
              })}
            </StepText>
          </Flex>
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
          <SoftwareCheckStep
            isDisplayed={isDisplayed}
            onComplete={handleSoftwareCheckComplete}
            productName={productName}
          />
        ),
      },
      {
        key: StepKey.Applications,
        status: "inactive",
        title: "Nano applications",
        renderBody: () => (
          <ApplicationContent
            onComplete={handleInstallRecommendedApplicationComplete}
            productName={productName}
          />
        ),
      },
      {
        key: StepKey.Ready,
        status: "inactive",
        title: "Nano is ready",
      },
    ],
    [t, productName, handleSoftwareCheckComplete, handleInstallRecommendedApplicationComplete],
  );

  const [steps, setSteps] = useState<Step[]>(defaultSteps);
  const [stopPolling, setStopPolling] = useState<boolean>(false);
  const [desyncTimer, setDesyncTimer] = useState<NodeJS.Timeout | null>(null);
  const [resyncDelay, setResyncDelay] = useState<number>(resyncDelayMs);
  const [desyncTimeout, setDesyncTimeout] = useState<number>(desyncTimeoutMs);

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

  const [isHelpDrawerOpen, setHelpDrawerOpen] = useState<boolean>(false);
  const [isTroubleshootingDrawerOpen, setTroubleshootingDrawerOpen] = useState<boolean>(false);
  const [lastKnownDeviceId, setLastKnownDeviceId] = useState<DeviceModelId>(DeviceModelId.nanoX);

  const handleClose = useCallback(() => {
    history.push("/onboarding/select-device");
  }, [history]);

  const handleTroubleshootingDrawerClose = useCallback(() => {
    setTroubleshootingDrawerOpen(false);
    setStopPolling(false);
  }, []);

  const handleDeviceReady = useCallback(() => {
    history.push("/onboarding/sync/completion");
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
    if (
      deviceOnboardingState?.isOnboarded &&
      deviceOnboardingState?.currentOnboardingStep === DeviceOnboardingStep.Ready
    ) {
      setStepKey(StepKey.SoftwareCheck);
      return;
    }

    switch (deviceOnboardingState?.currentOnboardingStep) {
      case DeviceOnboardingStep.SetupChoice:
      case DeviceOnboardingStep.RestoreSeed:
      case DeviceOnboardingStep.SafetyWarning:
      case DeviceOnboardingStep.NewDevice:
      case DeviceOnboardingStep.NewDeviceConfirming:
        setStepKey(StepKey.Seed);
        break;
      case DeviceOnboardingStep.WelcomeScreen1:
      case DeviceOnboardingStep.WelcomeScreen2:
      case DeviceOnboardingStep.WelcomeScreen3:
      case DeviceOnboardingStep.WelcomeScreen4:
      case DeviceOnboardingStep.WelcomeScreenReminder:
      case DeviceOnboardingStep.ChooseName:
        setStepKey(StepKey.Paired);
        break;
      case DeviceOnboardingStep.Pin:
        setStepKey(StepKey.Pin);
        break;
      default:
        break;
    }
  }, [deviceOnboardingState]);

  // When the user gets close to the seed generation step, sets the lost synchronization delay
  // and timers to a higher value. It avoids having a warning message while the connection is lost
  // because the device is generating the seed.
  useEffect(() => {
    if (
      deviceOnboardingState?.seedPhraseType &&
      [DeviceOnboardingStep.NewDeviceConfirming, DeviceOnboardingStep.RestoreSeed].includes(
        deviceOnboardingState?.currentOnboardingStep,
      )
    ) {
      const nbOfSeedWords = fromSeedPhraseTypeToNbOfSeedWords.get(
        deviceOnboardingState.seedPhraseType,
      );

      if (nbOfSeedWords && deviceOnboardingState?.currentSeedWordIndex >= nbOfSeedWords - 2) {
        setResyncDelay(longResyncDelayMs);
        setDesyncTimeout(longDesyncTimeoutMs);
      }
    }
  }, [deviceOnboardingState]);

  useEffect(() => {
    if (stepKey >= StepKey.SoftwareCheck) {
      setStopPolling(true);
    }

    if (stepKey === StepKey.Ready) {
      setTimeout(() => setStepKey(StepKey.Exit), readyRedirectDelayMs / 2);
    }

    if (stepKey === StepKey.Exit) {
      setTimeout(handleDeviceReady, readyRedirectDelayMs / 2);
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
    setTroubleshootingDrawerOpen(true);
  }, [fatalError]);

  useEffect(() => {
    if ((!device || allowedError) && !desyncTimer) {
      setDesyncTimer(setTimeout(handleDesyncTimerRunsOut, desyncTimeout));
    } else if (!!device && !allowedError && desyncTimer) {
      clearTimeout(desyncTimer);
      setDesyncTimer(null);
    }
  }, [device, allowedError, handleDesyncTimerRunsOut, desyncTimer, desyncTimeout]);

  useEffect(() => {
    if (isTroubleshootingDrawerOpen) {
      setStopPolling(true);
    }
  }, [isTroubleshootingDrawerOpen]);

  return (
    <Flex bg="background.main" width="100%" height="100%" flexDirection="column">
      <Header onClose={handleClose} onHelp={() => setHelpDrawerOpen(true)} />
      <HelpDrawer isOpen={isHelpDrawerOpen} onClose={() => setHelpDrawerOpen(false)} />
      <TroubleshootingDrawer
        lastKnownDeviceId={lastKnownDeviceId}
        isOpen={isTroubleshootingDrawerOpen}
        onClose={handleTroubleshootingDrawerClose}
      />
      <Flex flex={1} position="relative" overflow="hidden">
        <DesyncOverlay isOpen={!!desyncTimer} delay={resyncDelay} productName={productName} />
        <Flex flex={1} px="120px" py={0}>
          <Flex flex={1} flexDirection="column" overflow="hidden" justifyContent="center">
            <Flex flex={1} flexGrow={0} alignItems="center" mb={12}>
              <Text variant="h3Inter" fontSize="28px" fontWeight="semiBold">
                {t("syncOnboarding.manual.title", { deviceName })}
              </Text>
            </Flex>
            <Flex maxWidth="680px" flexShrink={1} overflowY="scroll">
              <VerticalTimeline flex={1} steps={steps} />
            </Flex>
          </Flex>
          <Flex flex={1} justifyContent="center" alignItems="center">
            {device?.modelId === "stax" ? (
              <Animation
                height="540px"
                animation={getDeviceAnimation(
                  "stax" as DeviceModelId,
                  theme.theme as "light" | "dark",
                  "placeHolder",
                )}
              />
            ) : (
              <DeviceIllustration deviceId={device?.modelId || ("nanoS" as DeviceModelId)} />
            )}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default SyncOnboardingManual;
