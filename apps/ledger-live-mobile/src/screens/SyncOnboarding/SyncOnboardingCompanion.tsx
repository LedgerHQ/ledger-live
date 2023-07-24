import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
  useLayoutEffect,
} from "react";
import { Flex, VerticalTimeline, Text, ContinueOnDevice, Divider } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import {
  OnboardingStep as DeviceOnboardingStep,
  fromSeedPhraseTypeToNbOfSeedWords,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useDispatch } from "react-redux";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

import { SeedPhraseType, StorylyInstanceID } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { addKnownDevice } from "../../actions/ble";
import { ScreenName } from "../../const";
import HelpDrawer from "./HelpDrawer";
import ResyncOverlay from "./ResyncOverlay";
import SoftwareChecksStep from "./SoftwareChecksStep";
import {
  completeOnboarding,
  setHasOrderedNano,
  setLastConnectedDevice,
  setReadOnlyMode,
} from "../../actions/settings";
import InstallSetOfApps from "../../components/DeviceAction/InstallSetOfApps";
import Stories from "../../components/StorylyStories";
import { TrackScreen, screen } from "../../analytics";
import ContinueOnStax from "./assets/ContinueOnStax";
import type { SyncOnboardingScreenProps } from ".";

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

export type SyncOnboardingCompanionProps = {
  /**
   * A `Device` object
   */
  device: Device;
  /**
   * A react-navigation instance to handle navigation once the device is ready, when there is a desync
   * issue, and to update the react-navigation header with available languages
   */
  navigation: SyncOnboardingScreenProps["navigation"];
  /**
   * Called when the polling from the companion component has definitely lost/is desync with the device
   */
  onLostDevice: () => void;

  /**
   * Called when the companion is displaying an alert message that should overlay
   * all the screen, including the header
   */
  onShouldHeaderBeOverlaid: (shouldBeOverlaid: boolean) => void;

  /**
   * Updates any existing delay before displaying the hiding the header below an overlay
   */
  updateHeaderOverlayDelay: (delayMs: number) => void;

  /**
   * Called by the companion component to force a reset of the entire sync onboarding because the device is not in a correct state anymore
   */
  notifySyncOnboardingShouldReset: () => void;
};

const POLLING_PERIOD_MS = 1000;

const NORMAL_DESYNC_TIMEOUT_MS = 60000;
const LONG_DESYNC_TIMEOUT_MS = 120000;

export const NORMAL_RESYNC_OVERLAY_DISPLAY_DELAY_MS = 10000;
const LONG_RESYNC_OVERLAY_DISPLAY_DELAY_MS = 60000;
const READY_REDIRECT_DELAY_MS = 2500;

const fallbackDefaultAppsToInstall = ["Bitcoin", "Ethereum", "Polygon"];

const fromSeedPhraseTypeToAnalyticsPropertyString = new Map<SeedPhraseType, string>([
  [SeedPhraseType.TwentyFour, "TwentyFour"],
  [SeedPhraseType.Eighteen, "Eighteen"],
  [SeedPhraseType.Twelve, "Twelve"],
]);

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
  return <ContinueOnDevice Icon={ContinueOnStax} text={text} withTopDivider={withTopDivider} />;
};

/**
 * Component representing the synchronous companion step, which polls the current device state
 * to display correctly information about the onboarding to the user
 *
 * The resync alert message overlay is rendered from this component to better handle relative position
 * with the vertical timeline.
 */
export const SyncOnboardingCompanion: React.FC<SyncOnboardingCompanionProps> = ({
  navigation,
  device,
  updateHeaderOverlayDelay,
  onShouldHeaderBeOverlaid,
  onLostDevice,
  notifySyncOnboardingShouldReset,
}) => {
  const { t } = useTranslation();
  const dispatchRedux = useDispatch();
  const deviceInitialApps = useFeature("deviceInitialApps");

  const productName = getDeviceModel(device.modelId).productName || device.modelId;
  const deviceName = device.deviceName || productName;

  const initialAppsToInstall = deviceInitialApps?.params?.apps || fallbackDefaultAppsToInstall;

  const [companionStepKey, setCompanionStepKey] = useState<CompanionStepKey>(
    CompanionStepKey.Paired,
  );
  const lastCompanionStepKey = useRef<CompanionStepKey>();
  const [seedPathStatus, setSeedPathStatus] = useState<
    | "choice_new_or_restore"
    | "new_seed"
    | "choice_restore_direct_or_recover"
    | "restore_seed"
    | "recover_seed"
  >("choice_new_or_restore");

  const servicesConfig = useFeature("protectServicesMobile");

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

  const [isPollingOn, setIsPollingOn] = useState<boolean>(true);

  const [isResyncOverlayOpen, setIsResyncOverlayOpen] = useState<boolean>(false);
  const [resyncOverlayDisplayDelayMs, setResyncOverlayDisplayDelayMs] = useState<number>(
    NORMAL_RESYNC_OVERLAY_DISPLAY_DELAY_MS,
  );

  const [desyncTimeoutMs, setDesyncTimeoutMs] = useState<number>(NORMAL_DESYNC_TIMEOUT_MS);

  const desyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isHelpDrawerOpen, setHelpDrawerOpen] = useState<boolean>(false);
  const [shouldRestoreApps, setShouldRestoreApps] = useState<boolean>(false);

  const {
    onboardingState: deviceOnboardingState,
    allowedError,
    fatalError,
  } = useOnboardingStatePolling({
    device,
    pollingPeriodMs: POLLING_PERIOD_MS,
    stopPolling: !isPollingOn,
  });

  // Unmount cleanup to make sure the polling is stopped.
  // The cleanup function triggered by the useEffect of useOnboardingStatePolling
  // has been observed to be called after, and some apdu could still be exchanged with the device
  useEffect(() => {
    return () => {
      setIsPollingOn(false);
    };
  }, []);

  const handleDesyncTimedOut = useCallback(() => {
    setIsPollingOn(false);

    onShouldHeaderBeOverlaid(false);
    setIsResyncOverlayOpen(false);

    onLostDevice();
  }, [onShouldHeaderBeOverlaid, onLostDevice]);

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
    setIsPollingOn(false);
    onLostDevice();
  }, [fatalError, onLostDevice]);

  // Reacts to allowedError from the polling to set or clean the desync timeout
  useEffect(() => {
    if (allowedError) {
      desyncTimerRef.current = setTimeout(handleDesyncTimedOut, desyncTimeoutMs);

      // Displays an overlay to alert the user. This overlay should also hide the screen header
      setIsResyncOverlayOpen(true);
      onShouldHeaderBeOverlaid(true);
    } else if (!allowedError) {
      // desyncTimer is cleared in the useEffect cleanup function
      setIsResyncOverlayOpen(false);
      onShouldHeaderBeOverlaid(false);
    }

    return () => {
      // Note if you update `allowedError`: `allowedError` needs to stay stable,
      // and not change its reference if the error is the same to avoid resetting the timer
      if (desyncTimerRef.current) {
        clearTimeout(desyncTimerRef.current);
        desyncTimerRef.current = null;
      }
    };
  }, [allowedError, handleDesyncTimedOut, desyncTimeoutMs, onShouldHeaderBeOverlaid]);

  /**
   * True if the device was initially onboarded/seeded when this component got
   * mounted. False otherwise.
   * Value is undefined until the onboarding state polling returns a first
   * result.
   * */
  const deviceInitiallyOnboarded = useRef<boolean>();
  /**
   * Variable holding the seed phrase type (number of words) until we are
   * ready to track the event (when the seeding step finishes).
   * Should only be maintained if the device is not onboarded/not seeded as the
   * onboarding flags can only be trusted for a non-onboarded device.
   */
  const analyticsSeedPhraseType = useRef<SeedPhraseType>();
  useEffect(() => {
    if (!deviceOnboardingState) return;

    if (deviceInitiallyOnboarded.current === undefined) {
      deviceInitiallyOnboarded.current = deviceOnboardingState.isOnboarded;
    }

    if (
      !deviceOnboardingState.isOnboarded && // onboarding state flags can only be trusted for a non-onboarded/non-seeded device
      deviceOnboardingState.seedPhraseType
    ) {
      analyticsSeedPhraseType.current = deviceOnboardingState.seedPhraseType;
    }
  }, [deviceOnboardingState]);

  const analyticsSeedConfiguration = useRef<"new_seed" | "restore_seed" | "recover_seed">();

  const analyticsSeedingTracked = useRef(false);
  /**
   * Analytics: track complete seeding of device
   * We use useLayoutEffect to ensure the event is sent before the following
   * step gets rendered and its corresponding analytics event gets dispatched
   */
  useLayoutEffect(() => {
    if (
      deviceInitiallyOnboarded.current === false && // can't just use ! operator because value can be undefined
      lastCompanionStepKey.current !== undefined &&
      lastCompanionStepKey.current <= CompanionStepKey.Seed &&
      companionStepKey > CompanionStepKey.Seed &&
      !analyticsSeedingTracked.current
    ) {
      screen(
        `Set up ${productName}: Step 3 Seed Success`,
        undefined,
        {
          seedPhraseType: analyticsSeedPhraseType.current
            ? fromSeedPhraseTypeToAnalyticsPropertyString.get(analyticsSeedPhraseType.current)
            : undefined,
          seedConfiguration: analyticsSeedConfiguration.current,
        },
        true,
        true,
      );

      analyticsSeedingTracked.current = true;
    }
    lastCompanionStepKey.current = companionStepKey;
  }, [companionStepKey, productName]);

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
      setCompanionStepKey(CompanionStepKey.SoftwareCheck);
      return;
    }

    // case DeviceOnboardingStep.SafetyWarning not handled so the previous step (new seed, restore, recover) is kept
    switch (deviceOnboardingState?.currentOnboardingStep) {
      // Those cases could happen if the device restarted
      case DeviceOnboardingStep.WelcomeScreen1:
      case DeviceOnboardingStep.WelcomeScreen2:
      case DeviceOnboardingStep.WelcomeScreen3:
      case DeviceOnboardingStep.WelcomeScreen4:
      case DeviceOnboardingStep.WelcomeScreenReminder:
      case DeviceOnboardingStep.OnboardingEarlyCheck:
        notifySyncOnboardingShouldReset();
        break;

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
        analyticsSeedConfiguration.current = "new_seed";
        break;
      case DeviceOnboardingStep.SetupChoiceRestore:
        setCompanionStepKey(CompanionStepKey.Seed);
        setSeedPathStatus("choice_restore_direct_or_recover");
        break;
      case DeviceOnboardingStep.RestoreSeed:
        setShouldRestoreApps(true);
        setCompanionStepKey(CompanionStepKey.Seed);
        setSeedPathStatus("restore_seed");
        analyticsSeedConfiguration.current = "restore_seed";
        break;
      case DeviceOnboardingStep.RecoverRestore:
        setShouldRestoreApps(true);
        setCompanionStepKey(CompanionStepKey.Seed);
        setSeedPathStatus("recover_seed");
        analyticsSeedConfiguration.current = "recover_seed";
        break;
      default:
        break;
    }
  }, [deviceOnboardingState, notifySyncOnboardingShouldReset, shouldRestoreApps]);

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
        setResyncOverlayDisplayDelayMs(LONG_RESYNC_OVERLAY_DISPLAY_DELAY_MS);
        updateHeaderOverlayDelay(LONG_RESYNC_OVERLAY_DISPLAY_DELAY_MS);
        setDesyncTimeoutMs(LONG_DESYNC_TIMEOUT_MS);
      }
    }
  }, [deviceOnboardingState, updateHeaderOverlayDelay]);

  const preventNavigation = useRef(false);

  useEffect(() => {
    if (companionStepKey >= CompanionStepKey.SoftwareCheck) {
      setIsPollingOn(false);
    }

    if (companionStepKey === CompanionStepKey.Exit) {
      preventNavigation.current = true;
      readyRedirectTimerRef.current = setTimeout(() => {
        preventNavigation.current = false;
        handleDeviceReady();
      }, READY_REDIRECT_DELAY_MS);
    }

    return () => {
      if (readyRedirectTimerRef.current) {
        preventNavigation.current = false;
        clearTimeout(readyRedirectTimerRef.current);
        readyRedirectTimerRef.current = null;
      }
    };
  }, [companionStepKey, handleDeviceReady]);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", e => {
        if (preventNavigation.current) e.preventDefault();
      }),
    [navigation],
  );

  useEffect(() => {
    if (seedPathStatus === "recover_seed" && servicesConfig?.enabled) {
      navigation.navigate(ScreenName.Recover, {
        fromOnboarding: true,
        device,
        platform: servicesConfig.params?.protectId,
        redirectTo: "restore",
      });
    }
  }, [
    device,
    navigation,
    seedPathStatus,
    servicesConfig?.enabled,
    servicesConfig?.params?.protectId,
  ]);

  const companionSteps: Step[] = useMemo(
    () =>
      [
        {
          key: CompanionStepKey.Paired,
          title: t("syncOnboarding.pairingStep.title", { productName }),
          renderBody: () => (
            <>
              <TrackScreen category={`Set up ${productName}: Step 1 device paired`} />
              <BodyText>{t("syncOnboarding.pairingStep.description", { productName })}</BodyText>
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
              <TrackScreen category={`Set up ${productName}: Step 2 PIN`} />
              <BodyText>{t("syncOnboarding.pinStep.description", { productName })}</BodyText>
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
              <TrackScreen category={`Set up ${productName}: Step 3 Seed Intro`} />
              {seedPathStatus === "new_seed" ? (
                <Flex pb={1}>
                  <BodyText mb={6}>
                    {t("syncOnboarding.seedStep.newSeedDescription", {
                      productName,
                    })}
                  </BodyText>
                  <Stories instanceID={StorylyInstanceID.recoverySeed} vertical keepOriginalOrder />
                  <ContinueOnDeviceWithAnim
                    deviceModelId={device.modelId}
                    text={t("syncOnboarding.seedStep.newSeedContinueOnDevice", {
                      productName,
                    })}
                  />
                </Flex>
              ) : seedPathStatus === "choice_restore_direct_or_recover" ? (
                <Flex>
                  <SubtitleText>{t("syncOnboarding.seedStep.restoreChoiceSRPTitle")}</SubtitleText>
                  <BodyText>{t("syncOnboarding.seedStep.restoreChoiceSRPDescription")}</BodyText>
                  <Divider text={t("common.or")} my={6} />
                  <SubtitleText>
                    {t("syncOnboarding.seedStep.restoreChoiceRecoverTitle")}
                  </SubtitleText>
                  <BodyText>
                    {t("syncOnboarding.seedStep.restoreChoiceRecoverDescription")}
                  </BodyText>
                  <ContinueOnDeviceWithAnim
                    deviceModelId={device.modelId}
                    text={t("syncOnboarding.seedStep.restoreChoiceContinueOnDevice", {
                      productName,
                    })}
                  />
                </Flex>
              ) : seedPathStatus === "restore_seed" ? (
                <BodyText>{t("syncOnboarding.seedStep.restoreSeed", { productName })}</BodyText>
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
                    text={t("syncOnboarding.seedStep.selectionContinueOnDevice", {
                      productName,
                    })}
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

  const safeAreaInsets = useSafeAreaInsets();

  return (
    <>
      <HelpDrawer isOpen={isHelpDrawerOpen} onClose={() => setHelpDrawerOpen(false)} />
      <Flex position="relative" flex={1} px={6}>
        <ResyncOverlay
          isOpen={isResyncOverlayOpen}
          delay={resyncOverlayDisplayDelayMs}
          productName={productName}
        />
        <Flex>
          <VerticalTimeline
            steps={companionSteps}
            formatEstimatedTime={formatEstimatedTime}
            contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }}
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
    </>
  );
};
