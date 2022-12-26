import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from "react";
import type { StackScreenProps } from "@react-navigation/stack";
import {
  Flex,
  ScrollContainer,
  VerticalTimeline,
  Text,
} from "@ledgerhq/native-ui";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import {
  OnboardingStep as DeviceOnboardingStep,
  fromSeedPhraseTypeToNbOfSeedWords,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import { useDispatch } from "react-redux";
import { CompositeScreenProps } from "@react-navigation/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

import { StorylyInstanceID } from "@ledgerhq/types-live";
import { addKnownDevice } from "../../actions/ble";
import { NavigatorName, ScreenName } from "../../const";
import HelpDrawer from "./HelpDrawer";
import DesyncDrawer from "./DesyncDrawer";
import ResyncOverlay from "./ResyncOverlay";
import LanguageSelect from "./LanguageSelect";
import SoftwareChecksStep from "./SoftwareChecksStep";
import {
  completeOnboarding,
  setHasOrderedNano,
  setLastConnectedDevice,
  setReadOnlyMode,
} from "../../actions/settings";
import DeviceSetupView from "../../components/DeviceSetupView";
import {
  BaseNavigatorStackParamList,
  NavigateInput,
} from "../../components/RootNavigator/types/BaseNavigator";
import { RootStackParamList } from "../../components/RootNavigator/types/RootNavigator";
import { SyncOnboardingStackParamList } from "../../components/RootNavigator/types/SyncOnboardingNavigator";
import InstallSetOfApps from "../../components/DeviceAction/InstallSetOfApps";
import Stories from "../../components/StorylyStories";

type StepStatus = "completed" | "active" | "inactive";

type Step = {
  key: CompanionStepKey;
  status: StepStatus;
  title: string;
  doneTitle?: string;
  estimatedTime?: number;
  renderBody?: (isDisplayed?: boolean) => ReactNode;
};

export type SyncOnboardingCompanionProps = CompositeScreenProps<
  StackScreenProps<
    SyncOnboardingStackParamList,
    ScreenName.SyncOnboardingCompanion
  >,
  CompositeScreenProps<
    StackScreenProps<BaseNavigatorStackParamList>,
    StackScreenProps<RootStackParamList>
  >
>;

const normalPollingPeriodMs = 1000;
const shortPollingPeriodMs = 400;
const normalDesyncTimeoutMs = 60000;
const longDesyncTimeoutMs = 120000;
const normalResyncOverlayDisplayDelayMs = 10000;
const longResyncOverlayDisplayDelayMs = 60000;
const readyRedirectDelayMs = 2500;

const fallbackDefaultAppsToInstall = ["Bitcoin", "Ethereum", "Polygon"];

// Because of https://github.com/typescript-eslint/typescript-eslint/issues/1197
enum CompanionStepKey {
  Paired = 0,
  Pin,
  Seed,
  SoftwareCheck,
  Apps,
  Ready,
  Exit,
}

export const SyncOnboarding = ({
  navigation,
  route,
}: SyncOnboardingCompanionProps) => {
  const { t } = useTranslation();
  const dispatchRedux = useDispatch();
  const deviceInitialApps = useFeature("deviceInitialApps");
  const { device } = route.params;

  const productName =
    getDeviceModel(device.modelId).productName || device.modelId;
  const deviceName = device.deviceName || productName;

  const initialAppsToInstall =
    deviceInitialApps?.params?.apps || fallbackDefaultAppsToInstall;

  const [companionStepKey, setCompanionStepKey] = useState<CompanionStepKey>(
    CompanionStepKey.Paired,
  );

  const getNextStepKey = useCallback(
    (step: CompanionStepKey) => {
      if (step === CompanionStepKey.Exit) {
        return CompanionStepKey.Exit;
      }
      let nextStep = step + 1; // by default, just increment the step
      if (nextStep === CompanionStepKey.Apps && !deviceInitialApps?.enabled) {
        nextStep += 1; // skip "Apps" step if flag is disabled
      }
      if (nextStep === CompanionStepKey.Ready) {
        nextStep += 1; // always skip "Ready" step and go straight to "Exit" to have the "Ready" step as "completed" right away
      }
      return nextStep;
    },
    [deviceInitialApps?.enabled],
  );

  const handleSoftwareCheckComplete = useCallback(() => {
    setCompanionStepKey(getNextStepKey(CompanionStepKey.SoftwareCheck));
  }, [getNextStepKey]);

  const handleInstallAppsComplete = useCallback(() => {
    setCompanionStepKey(getNextStepKey(CompanionStepKey.Apps));
  }, [getNextStepKey]);

  const formatEstimatedTime = (estimatedTime: number) =>
    t("syncOnboarding.estimatedTimeFormat", {
      estimatedTime: estimatedTime / 60,
    });

  const [stopPolling, setStopPolling] = useState<boolean>(false);
  const [pollingPeriodMs, setPollingPeriodMs] = useState<number>(
    normalPollingPeriodMs,
  );

  const [resyncOverlayDisplayDelayMs, setResyncOverlayDisplayDelayMs] =
    useState<number>(normalResyncOverlayDisplayDelayMs);
  const [desyncTimeoutMs, setDesyncTimeoutMs] = useState<number>(
    normalDesyncTimeoutMs,
  );

  const desyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [isDesyncOverlayOpen, setIsDesyncOverlayOpen] =
    useState<boolean>(false);
  const [isDesyncDrawerOpen, setDesyncDrawerOpen] = useState<boolean>(false);
  const [isHelpDrawerOpen, setHelpDrawerOpen] = useState<boolean>(false);

  const goBackToPairingFlow = useCallback(() => {
    const navigateInput: NavigateInput<
      RootStackParamList,
      NavigatorName.BaseOnboarding
    > = {
      name: NavigatorName.BaseOnboarding,
      params: {
        screen: NavigatorName.SyncOnboarding,
        params: {
          screen: ScreenName.SyncOnboardingCompanion,
          params: {
            // @ts-expect-error BleDevicePairingFlow will set this param
            device: null,
          },
        },
      },
    };

    // On pairing success, navigate to the Sync Onboarding Companion
    // Replace to avoid going back to this screen on return from the pairing flow
    navigation.navigate(NavigatorName.Base, {
      screen: ScreenName.BleDevicePairingFlow,
      params: {
        // TODO: For now, don't do that because stax shows up as nanoX
        // filterByDeviceModelId: device.modelId,
        areKnownDevicesDisplayed: true,
        onSuccessAddToKnownDevices: false,
        onSuccessNavigateToConfig: {
          navigationType: "navigate",
          navigateInput,
          pathToDeviceParam: "params.params.params.device",
        },
      },
    });
  }, [navigation]);

  const {
    onboardingState: deviceOnboardingState,
    allowedError,
    fatalError,
  } = useOnboardingStatePolling({
    device,
    pollingPeriodMs,
    stopPolling,
  });

  // Unmount cleanup to make sure the polling is stopped.
  // The cleanup function triggered by the useEffect of useOnboardingStatePolling
  // has been observed to be called after, and some apdu could still be exchanged with the device
  useEffect(() => {
    return () => {
      setStopPolling(true);
    };
  }, []);

  const handleClose = useCallback(() => {
    goBackToPairingFlow();
  }, [goBackToPairingFlow]);

  const handleDesyncTimedOut = useCallback(() => {
    setDesyncDrawerOpen(true);
  }, []);

  const handleDesyncRetry = useCallback(() => {
    // handleDesyncClose is then called
    setDesyncDrawerOpen(false);
  }, []);

  const handleDesyncClose = useCallback(() => {
    setDesyncDrawerOpen(false);
    goBackToPairingFlow();
  }, [goBackToPairingFlow]);

  const handleDeviceReady = useCallback(() => {
    // Adds the device to the list of known devices
    dispatchRedux(setReadOnlyMode(false));
    dispatchRedux(setHasOrderedNano(false));
    dispatchRedux(setLastConnectedDevice(device));
    dispatchRedux(completeOnboarding());
    dispatchRedux(
      addKnownDevice({
        id: device.deviceId,
        name: device.deviceName ?? device.modelId,
        modelId: device.modelId,
      }),
    );

    navigation.navigate(ScreenName.SyncOnboardingCompletion, { device });
  }, [device, dispatchRedux, navigation]);

  useEffect(() => {
    if (!fatalError) {
      return;
    }
    setDesyncDrawerOpen(true);
  }, [fatalError]);

  // Reacts to allowedError from the polling to set or clean the desync timeout
  useEffect(() => {
    if (allowedError) {
      desyncTimerRef.current = setTimeout(
        handleDesyncTimedOut,
        desyncTimeoutMs,
      );
      setIsDesyncOverlayOpen(true);
      // Accelerates the polling to resync as fast as possible with the device
      setPollingPeriodMs(shortPollingPeriodMs);
    } else if (!allowedError) {
      // desyncTimer is cleared in the useEffect cleanup function
      setPollingPeriodMs(normalPollingPeriodMs);
      setIsDesyncOverlayOpen(false);
    }

    return () => {
      // allowedError needs to stay stable, and not change its reference
      // if the error is the same to avoid resetting the timer
      if (desyncTimerRef.current) {
        clearTimeout(desyncTimerRef.current);
        desyncTimerRef.current = null;
      }
    };
  }, [allowedError, handleDesyncTimedOut, desyncTimeoutMs]);

  useEffect(() => {
    if (isDesyncDrawerOpen) {
      setStopPolling(true);
    }
  }, [isDesyncDrawerOpen]);

  useEffect(() => {
    if (
      deviceOnboardingState?.isOnboarded &&
      deviceOnboardingState?.currentOnboardingStep ===
        DeviceOnboardingStep.Ready
    ) {
      setCompanionStepKey(CompanionStepKey.SoftwareCheck);
      return;
    }

    switch (deviceOnboardingState?.currentOnboardingStep) {
      case DeviceOnboardingStep.SetupChoice:
      case DeviceOnboardingStep.RestoreSeed:
      case DeviceOnboardingStep.SafetyWarning:
      case DeviceOnboardingStep.NewDevice:
      case DeviceOnboardingStep.NewDeviceConfirming:
        setCompanionStepKey(CompanionStepKey.Seed);
        break;
      case DeviceOnboardingStep.WelcomeScreen1:
      case DeviceOnboardingStep.WelcomeScreen2:
      case DeviceOnboardingStep.WelcomeScreen3:
      case DeviceOnboardingStep.WelcomeScreen4:
      case DeviceOnboardingStep.WelcomeScreenReminder:
      case DeviceOnboardingStep.ChooseName:
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
  // and timers to a higher value. It avoids having a warning message while the connection is lost
  // because the device is generating the seed.
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
        deviceOnboardingState?.currentSeedWordIndex >= nbOfSeedWords - 2
      ) {
        setResyncOverlayDisplayDelayMs(longResyncOverlayDisplayDelayMs);
        setDesyncTimeoutMs(longDesyncTimeoutMs);
      }
    }
  }, [deviceOnboardingState]);

  useEffect(() => {
    if (companionStepKey >= CompanionStepKey.SoftwareCheck) {
      setStopPolling(true);
    }

    if (companionStepKey === CompanionStepKey.Exit) {
      readyRedirectTimerRef.current = setTimeout(
        handleDeviceReady,
        readyRedirectDelayMs,
      );
    }

    return () => {
      if (readyRedirectTimerRef.current) {
        clearTimeout(readyRedirectTimerRef.current);
        readyRedirectTimerRef.current = null;
      }
    };
  }, [companionStepKey, handleDeviceReady]);

  const companionSteps: Step[] = useMemo(
    () =>
      [
        {
          key: CompanionStepKey.Paired,
          title: t("syncOnboarding.pairingStep.title", { productName }),
          renderBody: () => (
            <Text variant="bodyLineHeight">
              {t("syncOnboarding.pairingStep.description", { productName })}
            </Text>
          ),
        },
        {
          key: CompanionStepKey.Pin,
          title: t("syncOnboarding.pinStep.title"),
          doneTitle: t("syncOnboarding.pinStep.doneTitle"),
          estimatedTime: 120,
          renderBody: () => (
            <Flex>
              <Text variant="bodyLineHeight">
                {t("syncOnboarding.pinStep.description", { productName })}
              </Text>
            </Flex>
          ),
        },
        {
          key: CompanionStepKey.Seed,
          title: t("syncOnboarding.seedStep.title"),
          doneTitle: t("syncOnboarding.seedStep.doneTitle"),
          estimatedTime: 300,
          renderBody: () => (
            <Flex pb={1}>
              <Stories
                instanceID={StorylyInstanceID.recoverySeed}
                vertical
                keepOriginalOrder
              />
            </Flex>
          ),
        },
        {
          key: CompanionStepKey.SoftwareCheck,
          title: t("syncOnboarding.softwareChecksSteps.title"),
          doneTitle: t("syncOnboarding.softwareChecksSteps.doneTitle", {
            productName,
          }),
          renderBody: (isDisplayed?: boolean) => (
            <SoftwareChecksStep
              device={device}
              isDisplayed={isDisplayed}
              onComplete={handleSoftwareCheckComplete}
            />
          ),
        },
        ...(deviceInitialApps?.enabled
          ? [
              {
                key: CompanionStepKey.Apps,
                title: t("syncOnboarding.appsStep.title", { productName }),
                estimatedTime: 60,
                renderBody: () => (
                  <InstallSetOfApps
                    device={device}
                    onResult={handleInstallAppsComplete}
                    dependencies={initialAppsToInstall}
                  />
                ),
              },
            ]
          : []),
        {
          key: CompanionStepKey.Ready,
          title: t("syncOnboarding.readyStep.title"),
          doneTitle: t("syncOnboarding.readyStep.doneTitle", { productName }),
        },
      ].map(step => ({
        ...step,
        status:
          step.key > companionStepKey
            ? "inactive"
            : step.key < companionStepKey
            ? "completed"
            : "active",
      })),
    [
      t,
      productName,
      deviceInitialApps?.enabled,
      device,
      handleSoftwareCheckComplete,
      handleInstallAppsComplete,
      initialAppsToInstall,
      companionStepKey,
    ],
  );

  return (
    <DeviceSetupView
      onClose={handleClose}
      renderLeft={() => (
        <LanguageSelect device={device} productName={productName} />
      )}
    >
      <HelpDrawer
        isOpen={isHelpDrawerOpen}
        onClose={() => setHelpDrawerOpen(false)}
      />
      <DesyncDrawer
        isOpen={isDesyncDrawerOpen}
        onClose={handleDesyncClose}
        onRetry={handleDesyncRetry}
        device={device}
      />
      <Flex position="relative" flex={1}>
        <ResyncOverlay
          isOpen={isDesyncOverlayOpen}
          delay={resyncOverlayDisplayDelayMs}
          productName={productName}
        />
        <ScrollContainer px={6}>
          <Flex mb={8} flexDirection="row" alignItems="center">
            <Text variant="h4" fontWeight="semiBold">
              {t("syncOnboarding.title", { deviceName })}
            </Text>
            {/* TODO: disabled for now but will be used in the future */}
            {/* <Button
                  ml={2}
                  Icon={Question}
                  onPress={() => setHelpDrawerOpen(true)}
                /> */}
          </Flex>
          <VerticalTimeline
            steps={companionSteps}
            formatEstimatedTime={formatEstimatedTime}
          />
        </ScrollContainer>
      </Flex>
    </DeviceSetupView>
  );
};
