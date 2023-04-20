import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { Flex, Text, VerticalTimeline } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { useTheme } from "styled-components";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { stringToDeviceModelId } from "@ledgerhq/devices/helpers";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import {
  OnboardingStep as DeviceOnboardingStep,
  fromSeedPhraseTypeToNbOfSeedWords,
} from "@ledgerhq/live-common/hw/extractOnboardingState";

import { lastSeenDeviceSelector } from "~/renderer/reducers/settings";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import HelpDrawer from "./HelpDrawer";
import TroubleshootingDrawer from "./TroubleshootingDrawer";
import SoftwareCheckStep from "./SoftwareCheckStep";
import { DesyncOverlay } from "./DesyncOverlay";
import SeedStep, { SeedPathStatus } from "./SeedStep";
import { StepText } from "./shared";
import Header from "./Header";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "../../DeviceAction/animations";
import DeviceIllustration from "../../DeviceIllustration";
import OnboardingAppInstallStep from "../../OnboardingAppInstall";
import { getOnboardingStatePolling } from "@ledgerhq/live-common/hw/getOnboardingStatePolling";

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

function nextStepKey(step: StepKey): StepKey {
  if (step === StepKey.Exit) {
    return StepKey.Exit;
  }
  return step + 1;
}

export type SyncOnboardingManualProps = {
  deviceModelId: string; // Should be DeviceModelId. react-router 5 seems to only handle [K in keyof Params]?: string props
};

/**
 * Component rendering the synchronous onboarding steps
 *
 * @param deviceModelId: a device model used to render the animation and text.
 *  Needed because the device object can be null if disconnected.
 */
const SyncOnboardingManual = ({ deviceModelId: strDeviceModelId }: SyncOnboardingManualProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const history = useHistory();
  const [stepKey, setStepKey] = useState<StepKey>(StepKey.Paired);
  const [shouldRestoreApps, setShouldRestoreApps] = useState<boolean>(false);
  const deviceToRestore = useSelector(lastSeenDeviceSelector) as DeviceModelInfo | null | undefined;
  const [seedPathStatus, setSeedPathStatus] = useState<SeedPathStatus>("choice_new_or_restore");

  const device = useSelector(getCurrentDevice);

  const deviceModelId = stringToDeviceModelId(strDeviceModelId, DeviceModelId.stax);
  // Needed because the device object can be null or changed if disconnected/reconnected
  const [lastKnownDeviceModelId, setLastKnownDeviceModelId] = useState<DeviceModelId>(
    deviceModelId,
  );

  useEffect(() => {
    if (device) {
      setLastKnownDeviceModelId(device.modelId);
    }
  }, [device]);

  const productName = device
    ? getDeviceModel(device.modelId).productName || device.modelId
    : "Ledger Device";
  const deviceName = device?.deviceName || productName;

  const [isHelpDrawerOpen, setHelpDrawerOpen] = useState<boolean>(false);
  const [isTroubleshootingDrawerOpen, setTroubleshootingDrawerOpen] = useState<boolean>(false);

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
        title: t("syncOnboarding.manual.seedContent.title"),
        renderBody: () => <SeedStep seedPathStatus={seedPathStatus} />,
        estimatedTime: 300,
      },
      {
        key: StepKey.SoftwareCheck,
        status: "inactive",
        title: t("syncOnboarding.manual.softwareCheckContent.title"),
        renderBody: (isDisplayed?: boolean) => (
          <SoftwareCheckStep
            deviceModelId={lastKnownDeviceModelId}
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
          <OnboardingAppInstallStep
            device={device}
            deviceToRestore={shouldRestoreApps && deviceToRestore ? deviceToRestore : undefined}
            onComplete={handleInstallRecommendedApplicationComplete}
            onError={handleInstallRecommendedApplicationComplete}
          />
        ),
      },
      {
        key: StepKey.Ready,
        status: "inactive",
        title: "Nano is ready",
      },
    ],
    [
      t,
      productName,
      seedPathStatus,
      lastKnownDeviceModelId,
      handleSoftwareCheckComplete,
      device,
      shouldRestoreApps,
      deviceToRestore,
      handleInstallRecommendedApplicationComplete,
    ],
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
    lockedDevice: lockedDeviceDuringPolling,
  } = useOnboardingStatePolling({
    getOnboardingStatePolling,
    device,
    pollingPeriodMs,
    stopPolling,
  });

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
    // When the device is seeded, there are 2 cases before triggering the software check step:
    // - the user came to the sync onboarding with an non-seeded device and did a full onboarding: onboarding flag `Ready`
    // - the user came to the sync onboarding with an already seeded device: onboarding flag `WelcomeScreen1`
    if (
      deviceOnboardingState?.isOnboarded &&
      [DeviceOnboardingStep.Ready, DeviceOnboardingStep.WelcomeScreen1].includes(
        deviceOnboardingState?.currentOnboardingStep,
      )
    ) {
      setStepKey(StepKey.SoftwareCheck);
      return;
    }

    // case DeviceOnboardingStep.SafetyWarning not handled so the previous step (new seed, restore, recover) is kept
    switch (deviceOnboardingState?.currentOnboardingStep) {
      case DeviceOnboardingStep.SetupChoice:
        setStepKey(StepKey.Seed);
        setSeedPathStatus("choice_new_or_restore");
        break;
      case DeviceOnboardingStep.NewDevice:
      case DeviceOnboardingStep.NewDeviceConfirming:
        setShouldRestoreApps(false);
        setStepKey(StepKey.Seed);
        setSeedPathStatus("new_seed");
        break;
      case DeviceOnboardingStep.SetupChoiceRestore:
        setStepKey(StepKey.Seed);
        setSeedPathStatus("choice_restore_direct_or_recover");
        break;
      case DeviceOnboardingStep.RestoreSeed:
        setShouldRestoreApps(true);
        setStepKey(StepKey.Seed);
        setSeedPathStatus("restore_seed");
        break;
      case DeviceOnboardingStep.RecoverRestore:
        setShouldRestoreApps(true);
        setStepKey(StepKey.Seed);
        setSeedPathStatus("recover_seed");
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

  const displayUnlockOrPlugDeviceAnimation = !device || (lockedDeviceDuringPolling && !stopPolling);

  return (
    <Flex bg="background.main" width="100%" height="100%" flexDirection="column">
      <Header onClose={handleClose} onHelp={() => setHelpDrawerOpen(true)} />
      <HelpDrawer isOpen={isHelpDrawerOpen} onClose={() => setHelpDrawerOpen(false)} />
      <TroubleshootingDrawer
        lastKnownDeviceId={lastKnownDeviceModelId}
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
            {displayUnlockOrPlugDeviceAnimation ? (
              <Animation
                height="540px"
                animation={getDeviceAnimation(
                  lastKnownDeviceModelId,
                  theme.theme,
                  lockedDeviceDuringPolling ? "enterPinCode" : "plugAndPinCode",
                )}
              />
            ) : (
              <DeviceIllustration deviceId={lastKnownDeviceModelId} />
            )}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default SyncOnboardingManual;
