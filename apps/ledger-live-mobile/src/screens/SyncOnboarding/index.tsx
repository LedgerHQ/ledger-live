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
  VerticalTimeline,
  Text,
  ContinueOnDevice,
  Divider,
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
import { DeviceModelId } from "@ledgerhq/types-devices";
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
import { TrackScreen, track } from "../../analytics";
import ContinueOnStax from "./assets/ContinueOnStax";

const { BodyText, SubtitleText } = VerticalTimeline;

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

const ContinueOnDeviceWithAnim: React.FC<{
  deviceModelId: DeviceModelId;
  text: string;
  withTopDivider?: boolean;
}> = ({ text, withTopDivider }) => {
  // TODO: when lotties are available, move this component to its own file and use a different lottie for each deviceModelId, as Icon prop
  return (
    <ContinueOnDevice
      Icon={ContinueOnStax}
      text={text}
      withTopDivider={withTopDivider}
    />
  );
};

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
  const [seedPathStatus, setSeedPathStatus] = useState<
    | "choice_new_or_restore"
    | "new_seed"
    | "choice_restore_direct_or_recover"
    | "restore_seed"
    | "recover_seed"
  >("choice_new_or_restore");

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
  const [shouldRestoreApps, setShouldRestoreApps] = useState<boolean>(false);

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

  const handleDesyncTimedOut = useCallback(() => {
    setDesyncDrawerOpen(true);
  }, []);

  const handleDesyncRetry = useCallback(() => {
    // handleDesyncClose is then called
    track("button_clicked", {
      button: "Try again",
      drawer: "Could not connect to Stax",
    });
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

  const handleClose = useCallback(() => {
    readyRedirectTimerRef.current ? handleDeviceReady() : goBackToPairingFlow();
  }, [goBackToPairingFlow, handleDeviceReady]);

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
    // When the device is seeded, there are 2 cases before triggering the software check step:
    // - the user came to the sync onboarding with an non-seeded device and did a full onboarding: onboarding flag `Ready`
    // - the user came to the sync onboarding with an already seeded device: onboarding flag `WelcomeScreen1`
    if (
      deviceOnboardingState?.isOnboarded &&
      [
        DeviceOnboardingStep.Ready,
        DeviceOnboardingStep.WelcomeScreen1,
      ].includes(deviceOnboardingState?.currentOnboardingStep)
    ) {
      setCompanionStepKey(CompanionStepKey.SoftwareCheck);
      return;
    }

    // case DeviceOnboardingStep.SafetyWarning not handled so the previous step (new seed, restore, recover) is kept
    switch (deviceOnboardingState?.currentOnboardingStep) {
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
      case DeviceOnboardingStep.SetupChoice:
        setCompanionStepKey(CompanionStepKey.Seed);
        setSeedPathStatus("choice_new_or_restore");
        break;
      case DeviceOnboardingStep.NewDevice:
      case DeviceOnboardingStep.NewDeviceConfirming:
        setShouldRestoreApps(false);
        setCompanionStepKey(CompanionStepKey.Seed);
        setSeedPathStatus("new_seed");
        break;
      case DeviceOnboardingStep.SetupChoiceRestore:
        setCompanionStepKey(CompanionStepKey.Seed);
        setSeedPathStatus("choice_restore_direct_or_recover");
        break;
      case DeviceOnboardingStep.RestoreSeed:
        setShouldRestoreApps(true);
        setCompanionStepKey(CompanionStepKey.Seed);
        setSeedPathStatus("restore_seed");
        break;
      case DeviceOnboardingStep.RecoverRestore:
        setShouldRestoreApps(true);
        setCompanionStepKey(CompanionStepKey.Seed);
        setSeedPathStatus("recover_seed");
        break;
      default:
        break;
    }
  }, [deviceOnboardingState, shouldRestoreApps]);

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
            <>
              <TrackScreen category="Set up Ledger Stax: Step 1 device paired" />
              <BodyText>
                {t("syncOnboarding.pairingStep.description", { productName })}
              </BodyText>
              <ContinueOnDeviceWithAnim
                deviceModelId={device.modelId}
                text={t("syncOnboarding.pairingStep.continueOnDevice", {
                  productName,
                })}
              />
            </>
          ),
        },
        {
          key: CompanionStepKey.Pin,
          title: t("syncOnboarding.pinStep.title"),
          doneTitle: t("syncOnboarding.pinStep.doneTitle"),
          renderBody: () => (
            <Flex>
              <TrackScreen category="Set up Ledger Stax: Step 2 PIN" />
              <BodyText>
                {t("syncOnboarding.pinStep.description", { productName })}
              </BodyText>
              <ContinueOnDeviceWithAnim
                deviceModelId={device.modelId}
                text={t("syncOnboarding.pinStep.continueOnDevice", {
                  productName,
                })}
              />
            </Flex>
          ),
        },
        {
          key: CompanionStepKey.Seed,
          title: t("syncOnboarding.seedStep.title"),
          doneTitle: t("syncOnboarding.seedStep.doneTitle"),
          renderBody: () => (
            <Flex>
              <TrackScreen category="Set up Ledger Stax: Step 3 Seed" />
              {seedPathStatus === "new_seed" ? (
                <Flex pb={1}>
                  <BodyText mb={6}>
                    {t("syncOnboarding.seedStep.newSeedDescription", {
                      productName,
                    })}
                  </BodyText>
                  <Stories
                    instanceID={StorylyInstanceID.recoverySeed}
                    vertical
                    keepOriginalOrder
                  />
                  <ContinueOnDeviceWithAnim
                    deviceModelId={device.modelId}
                    text={t("syncOnboarding.seedStep.newSeedContinueOnDevice", {
                      productName,
                    })}
                  />
                </Flex>
              ) : seedPathStatus === "choice_restore_direct_or_recover" ? (
                <Flex>
                  <SubtitleText>
                    {t("syncOnboarding.seedStep.restoreChoiceSRPTitle")}
                  </SubtitleText>
                  <BodyText>
                    {t("syncOnboarding.seedStep.restoreChoiceSRPDescription")}
                  </BodyText>
                  <Divider text={t("common.or")} my={6} />
                  <SubtitleText>
                    {t("syncOnboarding.seedStep.restoreChoiceRecoverTitle")}
                  </SubtitleText>
                  <BodyText>
                    {t(
                      "syncOnboarding.seedStep.restoreChoiceRecoverDescription",
                    )}
                  </BodyText>
                  <ContinueOnDeviceWithAnim
                    deviceModelId={device.modelId}
                    text={t(
                      "syncOnboarding.seedStep.restoreChoiceContinueOnDevice",
                      {
                        productName,
                      },
                    )}
                  />
                </Flex>
              ) : seedPathStatus === "restore_seed" ? (
                <BodyText>
                  {t("syncOnboarding.seedStep.restoreSeed", { productName })}
                </BodyText>
              ) : seedPathStatus === "recover_seed" ? (
                <BodyText>{t("syncOnboarding.seedStep.recoverSeed")}</BodyText>
              ) : (
                <Flex>
                  <BodyText>
                    {t("syncOnboarding.seedStep.selection", {
                      productName,
                    })}
                  </BodyText>
                  <ContinueOnDeviceWithAnim
                    deviceModelId={device.modelId}
                    text={t(
                      "syncOnboarding.seedStep.selectionContinueOnDevice",
                      {
                        productName,
                      },
                    )}
                  />
                </Flex>
              )}
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
                renderBody: () => (
                  <InstallSetOfApps
                    restore={shouldRestoreApps}
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
      seedPathStatus,
      deviceInitialApps?.enabled,
      device,
      handleSoftwareCheckComplete,
      handleInstallAppsComplete,
      initialAppsToInstall,
      companionStepKey,
      shouldRestoreApps,
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
      <Flex position="relative" flex={1} px={6}>
        <ResyncOverlay
          isOpen={isDesyncOverlayOpen}
          delay={resyncOverlayDisplayDelayMs}
          productName={productName}
        />
        <Flex>
          <VerticalTimeline
            steps={companionSteps}
            formatEstimatedTime={formatEstimatedTime}
            header={
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
            }
          />
          {companionStepKey === CompanionStepKey.Exit ? (
            <TrackScreen category="Stax Set Up - Final step: Stax is ready" />
          ) : null}
        </Flex>
      </Flex>
    </DeviceSetupView>
  );
};
