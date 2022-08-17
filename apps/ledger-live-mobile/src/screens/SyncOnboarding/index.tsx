import React, { useEffect, useState, useCallback, useMemo } from "react";
import type { StackScreenProps } from "@react-navigation/stack";
import {
  Button,
  Flex,
  ScrollContainer,
  VerticalTimeline,
  Text,
} from "@ledgerhq/native-ui";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/lib/onboarding/hooks/useOnboardingStatePolling";
import { CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import {
  OnboardingStep as DeviceOnboardingStep,
  fromSeedPhraseTypeToNbOfSeedWords,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";

import { ScreenName } from "../../const";
import { SyncOnboardingStackParamList } from "../../components/RootNavigator/SyncOnboardingNavigator";
import Question from "../../icons/Question";
import HelpDrawer from "./HelpDrawer";
import DesyncDrawer from "./DesyncDrawer";
import ResyncOverlay from "./ResyncOverlay";
import LanguageSelect from "./LanguageSelect";
import SoftwareChecksStep from "./SoftwareChecksStep";

type StepStatus = "completed" | "active" | "inactive";

type Step = {
  key: CompanionStepKey;
  status: StepStatus;
  title: string;
  estimatedTime?: number;
  renderBody?: (isDisplayed?: boolean) => ReactNode;
};

type Props = StackScreenProps<
  SyncOnboardingStackParamList,
  "SyncOnboardingCompanion"
>;

const normalPollingPeriodMs = 1000;
const shortPollingPeriodMs = 400;
const desyncTimeoutMs = 120000;
const shortResyncOverlayDisplayDelayMs = 1000;
const longResyncOverlayDisplayDelayMs = 1000;
const readyRedirectDelayMs = 2500;

/* eslint-disable no-unused-vars */
// Because of https://github.com/typescript-eslint/typescript-eslint/issues/1197
enum CompanionStepKey {
  Paired = 0,
  Pin,
  Seed,
  SoftwareCheck,
  Ready,
  Exit,
}
/* eslint-enable no-unused-vars */

function nextStepKey(step: CompanionStepKey): CompanionStepKey {
  if (step === CompanionStepKey.Exit) {
    return CompanionStepKey.Exit;
  }
  return step + 1;
}

export const SyncOnboarding = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { device } = route.params;

  const productName =
    getDeviceModel(device.modelId).productName || device.modelId;
  const deviceName = device.deviceName || productName;

  const handleSoftwareCheckComplete = useCallback(() => {
    setCompanionStepKey(nextStepKey(CompanionStepKey.SoftwareCheck));
  }, []);

  const formatEstimatedTime = (estimatedTime: number) =>
    t("syncOnboarding.estimatedTimeFormat", {
      estimatedTime: estimatedTime / 60,
    });

  const defaultCompanionSteps: Step[] = useMemo(
    () => [
      {
        key: CompanionStepKey.Paired,
        title: t("syncOnboarding.pairingStep.title", { productName }),
        status: "inactive",
        renderBody: () => (
          <Text variant="bodyLineHeight">
            {t("syncOnboarding.pairingStep.description", { productName })}
          </Text>
        ),
      },
      {
        key: CompanionStepKey.Pin,
        title: t("syncOnboarding.pinStep.title"),
        status: "inactive",
        estimatedTime: 120,
        renderBody: () => (
          <Flex>
            <Text variant="bodyLineHeight" mb={6}>
              {t("syncOnboarding.pinStep.description", { productName })}
            </Text>
            <Text variant="bodyLineHeight">
              {t("syncOnboarding.pinStep.warning", { productName })}
            </Text>
          </Flex>
        ),
      },
      {
        key: CompanionStepKey.Seed,
        title: t("syncOnboarding.seedStep.title"),
        status: "inactive",
        estimatedTime: 300,
        renderBody: () => (
          <Text variant="bodyLineHeight">
            {t("syncOnboarding.seedStep.description", { productName })}
          </Text>
        ),
      },
      {
        key: CompanionStepKey.SoftwareCheck,
        title: t("syncOnboarding.softwareChecksSteps.title"),
        status: "inactive",
        renderBody: (isDisplayed?: boolean) => (
          <SoftwareChecksStep
            device={device}
            isDisplayed={isDisplayed}
            onComplete={handleSoftwareCheckComplete}
          />
        ),
      },
      {
        key: CompanionStepKey.Ready,
        title: t("syncOnboarding.readyStep.title", { productName }),
        status: "inactive",
      },
    ],
    [t, productName, device, handleSoftwareCheckComplete],
  );

  const [desyncTimer, setDesyncTimer] = useState<NodeJS.Timeout | null>(null);
  const [stopPolling, setStopPolling] = useState<boolean>(false);
  const [pollingPeriodMs, setPollingPeriodMs] = useState<number>(
    normalPollingPeriodMs,
  );
  const [
    resyncOverlayDisplayDelayMs,
    setResyncOverlayDisplayDelayMs,
  ] = useState<number>(shortResyncOverlayDisplayDelayMs);
  const [isHelpDrawerOpen, setHelpDrawerOpen] = useState<boolean>(false);
  const [isDesyncDrawerOpen, setDesyncDrawerOpen] = useState<boolean>(false);
  const [companionSteps, setCompanionSteps] = useState<Step[]>(
    defaultCompanionSteps,
  );
  const [companionStepKey, setCompanionStepKey] = useState<CompanionStepKey>(
    CompanionStepKey.Paired,
  );

  const {
    onboardingState: deviceOnboardingState,
    allowedError,
    fatalError,
  } = useOnboardingStatePolling({
    device,
    pollingPeriodMs,
    stopPolling,
  });

  console.log(
    `🧙‍♂️ OnboardingState polling = ${JSON.stringify(
      deviceOnboardingState,
    )} and allowedError: ${JSON.stringify(
      allowedError,
    )} and pollingPeriodMs: ${pollingPeriodMs}`,
  );

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleDesyncTimedOut = useCallback(() => {
    setDesyncDrawerOpen(true);
  }, [setDesyncDrawerOpen]);

  const handleDesyncClose = useCallback(() => {
    setDesyncDrawerOpen(false);
    // Replace to avoid going back to this screen without re-rendering
    navigation.replace(ScreenName.BleDevicesScanning as "BleDevicesScanning");
  }, [navigation]);

  const handleDeviceReady = useCallback(() => {
    navigation.navigate(
      ScreenName.SyncOnboardingCompletion as "SyncOnboardingCompletion",
    );
  }, [navigation]);

  useEffect(() => {
    if (!fatalError) {
      return;
    }
    setDesyncDrawerOpen(true);
  }, [fatalError]);

  useEffect(() => {
    if (allowedError && !desyncTimer) {
      setDesyncTimer(setTimeout(handleDesyncTimedOut, desyncTimeoutMs));
      // Accelerates the polling to resync as fast as possible with the device
      setPollingPeriodMs(shortPollingPeriodMs);
    } else if (!allowedError && desyncTimer) {
      clearTimeout(desyncTimer);
      setDesyncTimer(null);
      setPollingPeriodMs(normalPollingPeriodMs);
    }
  }, [allowedError, handleDesyncTimedOut, desyncTimer]);

  useEffect(() => {
    if (isDesyncDrawerOpen) {
      setStopPolling(true);
    }
  }, [isDesyncDrawerOpen]);

  useEffect(() => {
    if (deviceOnboardingState?.isOnboarded) {
      setCompanionStepKey(CompanionStepKey.SoftwareCheck);
      return;
    }

    switch (deviceOnboardingState?.currentOnboardingStep) {
      case DeviceOnboardingStep.RestoreSeed:
      case DeviceOnboardingStep.SafetyWarning:
      case DeviceOnboardingStep.NewDevice:
      case DeviceOnboardingStep.NewDeviceConfirming:
        setCompanionStepKey(CompanionStepKey.Seed);
        break;
      case DeviceOnboardingStep.WelcomeScreen:
      case DeviceOnboardingStep.SetupChoice:
        setCompanionStepKey(CompanionStepKey.Paired);
        break;
      case DeviceOnboardingStep.Pin:
        setCompanionStepKey(CompanionStepKey.Pin);
        break;
      default:
        break;
    }
  }, [deviceOnboardingState]);

  // When the user gets close to the seed generation step, sets the lost synchronization delay
  // to a higher value. It avoids having a warning message while the connection is lost because
  // the device is generating the seed.
  useEffect(() => {
    if (
      deviceOnboardingState?.seedPhraseType &&
      [
        DeviceOnboardingStep.NewDeviceConfirming,
        DeviceOnboardingStep.RestoreSeed,
      ].includes(deviceOnboardingState?.currentOnboardingStep)
    ) {
      const nbOfSeedWords = fromSeedPhraseTypeToNbOfSeedWords.get(
        deviceOnboardingState.seedPhraseType,
      );

      if (
        nbOfSeedWords &&
        deviceOnboardingState?.currentSeedWordIndex >= nbOfSeedWords - 1
      ) {
        setResyncOverlayDisplayDelayMs(longResyncOverlayDisplayDelayMs);
      } else {
        setResyncOverlayDisplayDelayMs(shortResyncOverlayDisplayDelayMs);
      }
    }
  }, [deviceOnboardingState]);

  useEffect(() => {
    if (companionStepKey >= CompanionStepKey.SoftwareCheck) {
      setStopPolling(true);
    }

    if (companionStepKey === CompanionStepKey.Ready) {
      setTimeout(
        () => setCompanionStepKey(CompanionStepKey.Exit),
        readyRedirectDelayMs / 2,
      );
    }

    if (companionStepKey === CompanionStepKey.Exit) {
      setTimeout(handleDeviceReady, readyRedirectDelayMs / 2);
    }

    setCompanionSteps(
      defaultCompanionSteps.map(step => {
        const stepStatus =
          step.key > companionStepKey
            ? "inactive"
            : step.key < companionStepKey
            ? "completed"
            : "active";

        return {
          ...step,
          status: stepStatus,
        };
      }),
    );
  }, [companionStepKey, defaultCompanionSteps, handleDeviceReady]);

  return (
    <SafeAreaView>
      <Flex bg="background.main" height="100%" position="relative">
        <HelpDrawer
          isOpen={isHelpDrawerOpen}
          onClose={() => setHelpDrawerOpen(false)}
        />
        <DesyncDrawer
          isOpen={isDesyncDrawerOpen}
          onClose={handleDesyncClose}
          navigation={navigation}
          device={device}
        />
        <Flex
          flexDirection="row"
          justifyContent="space-between"
          pt={7}
          px={7}
          pb={4}
        >
          <LanguageSelect productName={productName} />
          <Button type="default" Icon={CloseMedium} onPress={handleClose} />
        </Flex>
        <Flex flex={1}>
          <ResyncOverlay
            isOpen={!!desyncTimer && !stopPolling}
            delay={resyncOverlayDisplayDelayMs}
            productName={productName}
          />
          <ScrollContainer>
            <Flex px={7} pt={2}>
              <Flex mb={7} flexDirection="row" alignItems="center">
                <Text variant="h4" fontWeight="semiBold">
                  {t("syncOnboarding.title", { deviceName })}
                </Text>
                <Button
                  ml={2}
                  Icon={Question}
                  onPress={() => setHelpDrawerOpen(true)}
                />
              </Flex>
              <VerticalTimeline
                steps={companionSteps}
                formatEstimatedTime={formatEstimatedTime}
              />
            </Flex>
          </ScrollContainer>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
};
