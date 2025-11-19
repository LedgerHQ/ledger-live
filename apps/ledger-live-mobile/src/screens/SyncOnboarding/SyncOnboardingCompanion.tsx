import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
  useLayoutEffect,
} from "react";
import { Image, Linking } from "react-native";
import { Flex, VerticalTimeline, Text, ContinueOnDevice, Link } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import {
  CharonStatus,
  OnboardingStep as DeviceOnboardingStep,
  fromSeedPhraseTypeToNbOfSeedWords,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useDispatch, useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { isAllowedOnboardingStatePollingErrorDmk } from "@ledgerhq/live-dmk-mobile";

import { SeedOriginType, SeedPhraseType } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { addKnownDevice } from "~/actions/ble";
import { NavigatorName, ScreenName } from "~/const";
import HelpDrawer from "./HelpDrawer";
import DesyncOverlay from "./DesyncOverlay";
import {
  completeOnboarding,
  setHasOrderedNano,
  setIsReborn,
  setLastConnectedDevice,
  setOnboardingHasDevice,
  setReadOnlyMode,
} from "~/actions/settings";
import InstallSetOfApps from "~/components/DeviceAction/InstallSetOfApps";
import { TrackScreen, screen, useTrack } from "~/analytics";
import ContinueOnStax from "./assets/ContinueOnStax";
import ContinueOnEuropa from "./assets/ContinueOnEuropa";
import ContinueOnApex from "./assets/ContinueOnApex";
import type { SyncOnboardingScreenProps } from "./SyncOnboardingScreenProps";
import { useIsFocused } from "@react-navigation/native";
import { useKeepScreenAwake } from "~/hooks/useKeepScreenAwake";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { useTrackOnboardingFlow } from "~/analytics/hooks/useTrackOnboardingFlow";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import {
  ExternalLinkMedium,
  RecoveryKey,
  Note,
  ShieldCheck,
} from "@ledgerhq/native-ui/assets/icons";
import SecretRecoveryPhraseImage from "./assets/srp.png";
import BackgroundBlue from "./assets/BackgroundBlue";
import BackgroundRed from "./assets/BackgroundRed";
import Animation from "~/components/Animation";
import CHARON from "~/animations/device/charon/charon.json";
import { ShadowedView } from "react-native-fast-shadow";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";

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

export type SeedPathStatus =
  | "choice_new_or_restore"
  | "new_seed"
  | "choice_restore_direct_or_recover"
  | "restore_seed"
  | "recover_seed"
  | "backup_charon"
  | "restore_charon";

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
  notifyEarlySecurityCheckShouldReset: () => void;
};

const POLLING_PERIOD_MS = 1000;

const NORMAL_DESYNC_TIMEOUT_MS = 60000;
const LONG_DESYNC_TIMEOUT_MS = 120000;

export const NORMAL_DESYNC_OVERLAY_DISPLAY_DELAY_MS = 10000;
const LONG_DESYNC_OVERLAY_DISPLAY_DELAY_MS = 60000;
const READY_REDIRECT_DELAY_MS = 2500;

const fallbackDefaultAppsToInstall = ["Bitcoin", "Ethereum", "Polygon"];

const fromSeedPhraseTypeToAnalyticsPropertyString = new Map<SeedPhraseType, string>([
  [SeedPhraseType.TwentyFour, "TwentyFour"],
  [SeedPhraseType.Eighteen, "Eighteen"],
  [SeedPhraseType.Twelve, "Twelve"],
]);

const CHARON_LEARN_MORE_URL = "https://shop.ledger.com/products/ledger-recovery-key";

// Because of https://github.com/typescript-eslint/typescript-eslint/issues/1197
enum CompanionStepKey {
  EarlySecurityCheckCompleted = 0,
  Pin,
  Seed,
  Apps,
  Ready,
  Exit,
}

/**
 * Component representing the synchronous companion step, which polls the current device state
 * to display correctly information about the onboarding to the user
 *
 * The desync alert message overlay is rendered from this component to better handle relative position
 * with the vertical timeline.
 */

export const SyncOnboardingCompanion: React.FC<SyncOnboardingCompanionProps> = ({
  navigation,
  device,
  updateHeaderOverlayDelay,
  onShouldHeaderBeOverlaid,
  onLostDevice,
  notifyEarlySecurityCheckShouldReset,
}) => {
  const { t } = useTranslation();
  const dispatchRedux = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const deviceInitialApps = useFeature("deviceInitialApps");

  const productName = getDeviceModel(device.modelId).productName || device.modelId;

  const initialAppsToInstall = deviceInitialApps?.params?.apps || fallbackDefaultAppsToInstall;

  const [companionStepKey, setCompanionStepKey] = useState<CompanionStepKey>(
    CompanionStepKey.EarlySecurityCheckCompleted,
  );
  const lastCompanionStepKey = useRef<CompanionStepKey>();
  const [seedPathStatus, setSeedPathStatus] = useState<SeedPathStatus>("choice_new_or_restore");

  useTrackOnboardingFlow({
    location: HOOKS_TRACKING_LOCATIONS.onboardingFlow,
    device,
    seedPathStatus,
  });

  const servicesConfig = useFeature("protectServicesMobile");

  const isFocused = useIsFocused();
  useKeepScreenAwake(isFocused);

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

  const handleInstallAppsComplete = useCallback(() => {
    setCompanionStepKey(getNextStepKey(CompanionStepKey.Apps));
  }, [getNextStepKey]);

  const formatEstimatedTime = (estimatedTime: number) =>
    t("syncOnboarding.estimatedTimeFormat", {
      estimatedTime: estimatedTime / 60,
    });

  const [isPollingOn, setIsPollingOn] = useState<boolean>(true);

  const [isDesyncOverlayOpen, setIsDesyncOverlayOpen] = useState<boolean>(false);
  const [desyncOverlayDisplayDelayMs, setDesyncOverlayDisplayDelayMs] = useState<number>(
    NORMAL_DESYNC_OVERLAY_DISPLAY_DELAY_MS,
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
    allowedErrorChecks: [isAllowedOnboardingStatePollingErrorDmk],
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
    setIsDesyncOverlayOpen(false);

    onLostDevice();
  }, [onShouldHeaderBeOverlaid, onLostDevice]);

  /**
   * Adds the device to the list of known devices
   */
  const addToKnownDevices = useCallback(() => {
    dispatchRedux(setLastConnectedDevice(device));
    if (!device.wired) {
      dispatchRedux(
        addKnownDevice({
          id: device.deviceId,
          name: device.deviceName ?? device.modelId,
          modelId: device.modelId,
        }),
      );
    }
  }, [device, dispatchRedux]);

  /**
   * Triggers the end of the onboarding
   */
  const handleOnboardingDone = useCallback(() => {
    dispatchRedux(setReadOnlyMode(false));
    dispatchRedux(setHasOrderedNano(false));
    dispatchRedux(completeOnboarding());
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
      setIsDesyncOverlayOpen(true);
      onShouldHeaderBeOverlaid(true);
    } else if (!allowedError) {
      // desyncTimer is cleared in the useEffect cleanup function
      setIsDesyncOverlayOpen(false);
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

  const analyticsSeedConfiguration = useRef<SeedOriginType>();

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
      companionStepKey === CompanionStepKey.Seed &&
      !analyticsSeedingTracked.current &&
      (seedPathStatus === "backup_charon" ||
        (seedPathStatus === "restore_charon" && deviceOnboardingState?.isOnboarded))
    ) {
      /**
       * Now we have four ways to seed a device:
       * - new seed => Backup Recovery Key
       * - restore using Secret Recovery Phrase => Backup Recovery Key
       * - restore using Recovery Key => Next step
       * - restore using Recover subscription => Backup Recovery Key
       * Three of them will trigger the Backup Recovery Key step, but the last one
       * will trigger directly the install apps step, so its tracking is treated separately.
       */
      screen(
        "Set up device: Step 3 Seed Success",
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
  }, [companionStepKey, deviceOnboardingState?.isOnboarded, productName, seedPathStatus]);

  const seededDeviceHandled = useRef(false);

  useEffect(() => {
    // When the device is seeded, there are 2 cases before triggering the applications install step:
    // - the user came to the sync onboarding with an non-seeded device and did a full onboarding: onboarding flag `Ready`
    // - the user came to the sync onboarding with an already seeded device: onboarding flag `WelcomeScreen1`
    if (
      deviceOnboardingState?.isOnboarded &&
      !seededDeviceHandled.current &&
      [DeviceOnboardingStep.Ready, DeviceOnboardingStep.WelcomeScreen1].includes(
        deviceOnboardingState.currentOnboardingStep,
      )
    ) {
      setCompanionStepKey(
        deviceInitialApps?.enabled ? CompanionStepKey.Apps : CompanionStepKey.Ready,
      );
      seededDeviceHandled.current = true;
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
        notifyEarlySecurityCheckShouldReset();
        break;

      case DeviceOnboardingStep.ChooseName:
        setCompanionStepKey(CompanionStepKey.EarlySecurityCheckCompleted);
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
      case DeviceOnboardingStep.RestoreCharon:
        setCompanionStepKey(CompanionStepKey.Seed);
        setSeedPathStatus("restore_charon");
        analyticsSeedConfiguration.current = "restore_charon";
        break;
      case DeviceOnboardingStep.BackupCharon:
        setCompanionStepKey(CompanionStepKey.Seed);
        setSeedPathStatus("backup_charon");
        break;
      default:
        break;
    }
  }, [
    deviceInitialApps?.enabled,
    deviceOnboardingState,
    notifyEarlySecurityCheckShouldReset,
    shouldRestoreApps,
  ]);

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
        setDesyncOverlayDisplayDelayMs(LONG_DESYNC_OVERLAY_DISPLAY_DELAY_MS);
        updateHeaderOverlayDelay(LONG_DESYNC_OVERLAY_DISPLAY_DELAY_MS);
        setDesyncTimeoutMs(LONG_DESYNC_TIMEOUT_MS);
      }
    }
  }, [deviceOnboardingState, updateHeaderOverlayDelay]);

  const preventNavigation = useRef(false);

  const addedToKnownDevices = useRef(false);
  useEffect(() => {
    if (companionStepKey >= CompanionStepKey.Apps) {
      // Stops the polling once the device is seeded
      setIsPollingOn(false);
      // At this step, device has been successfully setup so it can be saved in
      // the list of known devices
      dispatchRedux(setIsReborn(false));
      if (!hasCompletedOnboarding) {
        dispatchRedux(setOnboardingHasDevice(true));
      }
      if (!addedToKnownDevices.current) {
        addedToKnownDevices.current = true;
        addToKnownDevices();
      }
    }

    if (companionStepKey === CompanionStepKey.Exit) {
      preventNavigation.current = true;
      readyRedirectTimerRef.current = setTimeout(() => {
        preventNavigation.current = false;
        handleOnboardingDone();
      }, READY_REDIRECT_DELAY_MS);
    }

    return () => {
      if (readyRedirectTimerRef.current) {
        preventNavigation.current = false;
        clearTimeout(readyRedirectTimerRef.current);
        readyRedirectTimerRef.current = null;
      }
    };
  }, [
    companionStepKey,
    addToKnownDevices,
    handleOnboardingDone,
    dispatchRedux,
    hasCompletedOnboarding,
  ]);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", e => {
        if (preventNavigation.current) e.preventDefault();
      }),
    [navigation],
  );

  useEffect(() => {
    if (seedPathStatus === "recover_seed" && servicesConfig?.enabled) {
      navigation.navigate(NavigatorName.Base, {
        screen: ScreenName.Recover,
        params: {
          fromOnboarding: true,
          device,
          platform: servicesConfig.params?.protectId,
          redirectTo: "restore",
          date: new Date().toISOString(), // adding a date to reload the page in case of same device restored again
        },
      });
    }
  }, [
    device,
    navigation,
    seedPathStatus,
    servicesConfig?.enabled,
    servicesConfig?.params?.protectId,
  ]);

  const track = useTrack();
  const handleLearnMoreClick = useCallback(() => {
    track("button_clicked", {
      button: "Learn More",
      page: "Charon Start",
    });
    Linking.openURL(CHARON_LEARN_MORE_URL);
  }, [track]);

  const DeviceIcon: IconType = useMemo(() => {
    switch (device.modelId) {
      case DeviceModelId.stax:
        return ContinueOnStax;
      case DeviceModelId.europa:
        return ContinueOnEuropa;
      case DeviceModelId.apex:
        return ContinueOnApex; // Use the same icon as Europa for now
      default:
        return ContinueOnEuropa; // Fallback to Europa icon
    }
  }, [device.modelId]);

  const companionSteps: Step[] = useMemo(
    () =>
      [
        {
          key: CompanionStepKey.EarlySecurityCheckCompleted,
          title: t("syncOnboarding.earlySecurityCheckCompletedStep.title", { productName }),
          renderBody: () => (
            <>
              <TrackScreen category={"Set up device: Step 1 device paired"} />
              <Text variant="body" color="neutral.c80" mb={6}>
                {t("syncOnboarding.earlySecurityCheckCompletedStep.subtitle", {
                  productName,
                })}
              </Text>
              <ContinueOnDevice
                Icon={DeviceIcon}
                text={t("syncOnboarding.earlySecurityCheckCompletedStep.description", {
                  productName,
                })}
                withTopDivider={true}
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
              <TrackScreen category={"Set up device: Step 2 PIN"} />
              <BodyText>{t("syncOnboarding.pinStep.description", { productName })}</BodyText>
              <ContinueOnDevice
                Icon={DeviceIcon}
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
          background:
            seedPathStatus === "new_seed" ? (
              <BackgroundBlue />
            ) : seedPathStatus === "backup_charon" ? (
              <BackgroundRed />
            ) : null,
          renderBody: () => (
            <Flex>
              <TrackScreen category={"Set up device: Step 3 Seed Intro"} />
              {seedPathStatus === "new_seed" ? (
                <Flex pb={1}>
                  <Flex alignItems="center" justifyContent="center">
                    <Flex style={{ overflow: "visible", height: 150 }}>
                      <Image source={SecretRecoveryPhraseImage} height={200} />
                    </Flex>
                    <Text variant="h5" fontWeight="semiBold" mb={6}>
                      {t("syncOnboarding.seedStep.newSeedTitle")}
                    </Text>
                    <BodyText mb={2} textAlign="center">
                      {t("syncOnboarding.seedStep.newSeedDescription")}
                    </BodyText>
                  </Flex>
                  <ContinueOnDevice
                    Icon={DeviceIcon}
                    text={t("syncOnboarding.seedStep.newSeedContinueOnDevice", {
                      productName,
                    })}
                  />
                </Flex>
              ) : seedPathStatus === "choice_restore_direct_or_recover" ? (
                <Flex>
                  <BodyText color="neutral.c80">
                    {t("syncOnboarding.seedStep.selectionRestoreChoice.description")}
                  </BodyText>
                  {/* Secret Recovery Phrase */}
                  <Flex flexDirection="row" mt={6}>
                    <Note size="M" />
                    <Flex ml={5} flex={1}>
                      <SubtitleText mb={2}>
                        {t(
                          "syncOnboarding.seedStep.selectionRestoreChoice.secretRecoveryPhrase.title",
                        )}
                      </SubtitleText>
                      <BodyText>
                        {t(
                          "syncOnboarding.seedStep.selectionRestoreChoice.secretRecoveryPhrase.description",
                        )}
                      </BodyText>
                    </Flex>
                  </Flex>
                  {/* Recovery Key */}
                  {deviceOnboardingState?.charonSupported && (
                    <Flex flexDirection="row" mt={6}>
                      <RecoveryKey size="M" />
                      <Flex ml={5} flex={1}>
                        <SubtitleText mb={2}>
                          {t("syncOnboarding.seedStep.selectionRestoreChoice.ledgerCharon.title")}
                        </SubtitleText>
                        <BodyText>
                          {t(
                            "syncOnboarding.seedStep.selectionRestoreChoice.ledgerCharon.description",
                          )}
                        </BodyText>
                      </Flex>
                    </Flex>
                  )}
                  {/* Recover subscription */}
                  <Flex flexDirection="row" mt={6} mb={6}>
                    <ShieldCheck size="M" />
                    <Flex ml={5} flex={1}>
                      <SubtitleText mb={2}>
                        {t("syncOnboarding.seedStep.selectionRestoreChoice.ledgerRecover.title")}
                      </SubtitleText>
                      <BodyText>
                        {t(
                          "syncOnboarding.seedStep.selectionRestoreChoice.ledgerRecover.description",
                        )}
                      </BodyText>
                    </Flex>
                  </Flex>
                  <ContinueOnDevice
                    Icon={DeviceIcon}
                    text={t("syncOnboarding.seedStep.selectionRestoreChoice.continueOnDevice", {
                      productName,
                    })}
                  />
                </Flex>
              ) : seedPathStatus === "restore_seed" ? (
                <Flex>
                  <SubtitleText>{t("syncOnboarding.seedStep.restoreSeed.title")}</SubtitleText>
                  <BodyText>{t("syncOnboarding.seedStep.restoreSeed.description")}</BodyText>
                  <ContinueOnDevice
                    Icon={DeviceIcon}
                    text={t("syncOnboarding.seedStep.restoreSeed.continueOnDevice", {
                      productName,
                    })}
                  />
                </Flex>
              ) : seedPathStatus === "recover_seed" ? (
                <BodyText>{t("syncOnboarding.seedStep.recoverSeed")}</BodyText>
              ) : seedPathStatus === "backup_charon" ? (
                <Flex>
                  {deviceOnboardingState?.charonStatus === CharonStatus.Choice ? (
                    <TrackScreen category="Set up device: Step 3 Charon Start" />
                  ) : null}
                  {deviceOnboardingState?.charonStatus === CharonStatus.Rejected ? (
                    <TrackScreen category="Set up device: Step 3 Charon Backup Rejected" />
                  ) : null}
                  {deviceOnboardingState?.charonStatus === CharonStatus.Ready ? (
                    <TrackScreen category="Set up device: Step 3 Charon Backup Success" />
                  ) : null}
                  <Flex alignItems="center" justifyContent="center">
                    <Flex style={{ overflow: "visible", height: 100 }} mt={16} mb={24}>
                      <ShadowedView
                        style={{
                          shadowOpacity: 0.15,
                          shadowRadius: 35.633,
                          shadowOffset: {
                            width: 0,
                            height: 53.291,
                          },
                        }}
                      >
                        <ShadowedView
                          style={{
                            shadowOpacity: 0.14,
                            shadowRadius: 21.153,
                            shadowOffset: {
                              width: 0,
                              height: 26.442,
                            },
                          }}
                        >
                          <ShadowedView
                            style={{
                              shadowOpacity: 0.11,
                              shadowRadius: 11.31,
                              shadowOffset: {
                                width: 0,
                                height: 14.137,
                              },
                            }}
                          >
                            <ShadowedView
                              style={{
                                shadowOpacity: 0.09,
                                shadowRadius: 6.34,
                                shadowOffset: {
                                  width: 0,
                                  height: 7.925,
                                },
                              }}
                            >
                              <ShadowedView
                                style={{
                                  shadowOpacity: 0.08,
                                  shadowRadius: 3.367,
                                  shadowOffset: {
                                    width: 0,
                                    height: 4.209,
                                  },
                                }}
                              >
                                <ShadowedView
                                  style={{
                                    shadowOpacity: 0.05,
                                    shadowRadius: 1.401,
                                    shadowOffset: {
                                      width: 0,
                                      height: 1.751,
                                    },
                                  }}
                                >
                                  <Animation style={{ height: 100 }} source={CHARON} />
                                </ShadowedView>
                              </ShadowedView>
                            </ShadowedView>
                          </ShadowedView>
                        </ShadowedView>
                      </ShadowedView>
                    </Flex>
                    <Text variant="h5" fontWeight="semiBold" mb={24}>
                      {t("syncOnboarding.seedStep.backupCharon.title")}
                    </Text>
                    <BodyText mb={24} textAlign="center">
                      {t("syncOnboarding.seedStep.backupCharon.desc")}
                    </BodyText>
                  </Flex>
                  <Flex mb={6} width="100%" justifyContent="center" alignItems="center">
                    <Link
                      Icon={ExternalLinkMedium}
                      onPress={handleLearnMoreClick}
                      style={{ justifyContent: "flex-start" }}
                    >
                      {t("syncOnboarding.seedStep.backupCharon.cta")}
                    </Link>
                  </Flex>
                  <ContinueOnDevice
                    Icon={DeviceIcon}
                    text={t("syncOnboarding.seedStep.backupCharon.continueOnDevice", {
                      productName,
                    })}
                  />
                </Flex>
              ) : seedPathStatus === "restore_charon" ? (
                <Flex>
                  <SubtitleText>
                    {t("syncOnboarding.seedStep.restoreLedgerCharon.title")}
                  </SubtitleText>
                  <BodyText>
                    {t("syncOnboarding.seedStep.restoreLedgerCharon.description")}
                  </BodyText>
                  <ContinueOnDevice
                    Icon={DeviceIcon}
                    text={t("syncOnboarding.seedStep.restoreLedgerCharon.continueOnDevice", {
                      productName,
                    })}
                  />
                </Flex>
              ) : (
                <Flex>
                  <BodyText color="neutral.c80">
                    {t("syncOnboarding.seedStep.selection", {
                      productName,
                    })}
                  </BodyText>

                  <Flex mt={6}>
                    <Text color="neutral.c100" fontWeight="semiBold" mb={3}>
                      {t("syncOnboarding.seedStep.selectionNewLedger.title")}
                    </Text>
                    <Text color="neutral.c80">
                      {t("syncOnboarding.seedStep.selectionNewLedger.desc")}
                    </Text>
                  </Flex>
                  <Flex my={6}>
                    <Text color="neutral.c100" fontWeight="semiBold" mb={3}>
                      {t("syncOnboarding.seedStep.selectionRestore.title")}
                    </Text>
                    <Text color="neutral.c80">
                      {deviceOnboardingState?.charonSupported
                        ? t("syncOnboarding.seedStep.selectionRestore.descWithCharon")
                        : t("syncOnboarding.seedStep.selectionRestore.desc")}
                    </Text>
                  </Flex>
                  <ContinueOnDevice
                    Icon={DeviceIcon}
                    text={t("syncOnboarding.seedStep.selectionContinueOnDevice", {
                      productName,
                    })}
                  />
                </Flex>
              )}
            </Flex>
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
      DeviceIcon,
      deviceOnboardingState?.charonSupported,
      deviceOnboardingState?.charonStatus,
      handleLearnMoreClick,
      shouldRestoreApps,
      device,
      handleInstallAppsComplete,
      initialAppsToInstall,
      companionStepKey,
    ],
  );

  const safeAreaInsets = useSafeAreaInsets();

  return (
    <>
      <HelpDrawer isOpen={isHelpDrawerOpen} onClose={() => setHelpDrawerOpen(false)} />
      <Flex position="relative" flex={1} px={6}>
        <DesyncOverlay
          isOpen={isDesyncOverlayOpen}
          delay={desyncOverlayDisplayDelayMs}
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
                  {t("syncOnboarding.title", { productName })}
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
            <TrackScreen category="Set up device: Final Step Your device is ready" />
          ) : null}
        </Flex>
      </Flex>
    </>
  );
};
