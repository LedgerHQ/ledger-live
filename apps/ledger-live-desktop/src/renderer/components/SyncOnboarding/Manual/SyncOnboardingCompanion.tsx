import React, {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHistory } from "react-router-dom";
import { Box, Flex, Text, VerticalTimeline } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelInfo, SeedPhraseType } from "@ledgerhq/types-live";
import {
  OnboardingStep as DeviceOnboardingStep,
  fromSeedPhraseTypeToNbOfSeedWords,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { useCustomPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { lastSeenDeviceSelector } from "~/renderer/reducers/settings";
import { DesyncOverlay } from "./DesyncOverlay";
import SeedStep, { SeedPathStatus } from "./SeedStep";
import { analyticsFlowName, StepText } from "./shared";
import OnboardingAppInstallStep from "../../OnboardingAppInstall";
import { getOnboardingStatePolling } from "@ledgerhq/live-common/hw/getOnboardingStatePolling";
import ContinueOnDeviceWithAnim from "./ContinueOnDeviceWithAnim";
import { RecoverState } from "~/renderer/screens/recover/Player";
import TrackPage from "~/renderer/analytics/TrackPage";
import { trackPage } from "~/renderer/analytics/segment";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { setDrawer } from "~/renderer/drawers/Provider";
import LockedDeviceDrawer, { Props as LockedDeviceDrawerProps } from "./LockedDeviceDrawer";
import { LockedDeviceError } from "@ledgerhq/errors";
import { saveSettings } from "~/renderer/actions/settings";

const READY_REDIRECT_DELAY_MS = 2000;
const POLLING_PERIOD_MS = 1000;

const DESYNC_TIMEOUT_MS = 60000;
const LONG_DESYNC_TIMEOUT_MS = 120000;

const DESYNC_OVERLAY_DELAY_MS = 1000;
const LONG_DESYNC_OVERLAY_DELAY_MS = 60000;

enum StepKey {
  Paired = 0,
  Pin,
  Seed,
  Applications,
  Ready,
  Exit,
}

const fromSeedPhraseTypeToAnalyticsPropertyString = new Map<SeedPhraseType, string>([
  [SeedPhraseType.TwentyFour, "TwentyFour"],
  [SeedPhraseType.Eighteen, "Eighteen"],
  [SeedPhraseType.Twelve, "Twelve"],
]);

type StepStatus = "completed" | "active" | "inactive";

type Step = {
  key: StepKey;
  status: StepStatus;
  title: string;
  titleCompleted?: string;
  hasLoader?: boolean;
  estimatedTime?: number;
  renderBody?: () => ReactNode;
};

function nextStepKey(step: StepKey): StepKey {
  if (step === StepKey.Exit) {
    return StepKey.Exit;
  }
  return step + 1;
}

export type SyncOnboardingCompanionProps = {
  /**
   * A `Device` object
   */
  device: Device;

  /**
   * Called when the polling from the companion component has definitely lost/is desync with the device
   */
  onLostDevice: () => void;

  /**
   * Called when the companion component thinks the device is not in a correct state anymore
   */
  notifySyncOnboardingShouldReset: () => void;
};

/**
 * Component rendering the synchronous onboarding companion
 */
const SyncOnboardingCompanion: React.FC<SyncOnboardingCompanionProps> = ({
  device,
  onLostDevice,
  notifySyncOnboardingShouldReset,
}) => {
  const { t } = useTranslation();
  const history = useHistory<RecoverState>();
  const dispatch = useDispatch();
  const [stepKey, setStepKey] = useState<StepKey>(StepKey.Paired);
  const [hasAppLoader, setHasAppLoader] = useState<boolean>(false);
  const [shouldRestoreApps, setShouldRestoreApps] = useState<boolean>(false);
  const deviceToRestore = useSelector(lastSeenDeviceSelector) as DeviceModelInfo | null | undefined;
  const lastCompanionStepKey = useRef<StepKey>();
  const [seedPathStatus, setSeedPathStatus] = useState<SeedPathStatus>("choice_new_or_restore");

  const servicesConfig = useFeature("protectServicesDesktop");
  const recoverRestoreStaxPath = useCustomPath(servicesConfig, "restore", "lld-stax-onboarding");

  const productName = device
    ? getDeviceModel(device.modelId).productName || device.modelId
    : "Ledger Device";
  const deviceName = device?.deviceName || productName;

  const handleInstallRecommendedApplicationComplete = useCallback(() => {
    setTimeout(() => setStepKey(nextStepKey(StepKey.Applications)), READY_REDIRECT_DELAY_MS);
  }, []);

  const defaultSteps: Step[] = useMemo(
    () => [
      {
        key: StepKey.Paired,
        status: "active",
        title: t("syncOnboarding.manual.pairedContent.title", {
          deviceName,
        }),
        renderBody: () => (
          <Flex flexDirection="column">
            <TrackPage
              category={`Set up ${productName}: Step 1 device paired`}
              flow={analyticsFlowName}
            />
            {/* @ts-expect-error weird props issue with React 18 */}
            <StepText>
              {
                t("syncOnboarding.manual.pairedContent.description", {
                  deviceName: productName,
                }) as string
              }
            </StepText>
            <ContinueOnDeviceWithAnim
              deviceModelId={device.modelId}
              text={t("syncOnboarding.manual.pairedContent.continueOnDevice", { productName })}
            />
          </Flex>
        ),
      },
      {
        key: StepKey.Pin,
        status: "inactive",
        title: t("syncOnboarding.manual.pinContent.title"),
        titleCompleted: t("syncOnboarding.manual.pinContent.titleCompleted"),
        renderBody: () => (
          <Flex flexDirection="column">
            <TrackPage category={`Set up ${productName}: Step 2 PIN`} flow={analyticsFlowName} />
            {/* @ts-expect-error weird props issue with React 18 */}
            <StepText>
              {t("syncOnboarding.manual.pinContent.description", { productName })}
            </StepText>
            <ContinueOnDeviceWithAnim
              deviceModelId={device.modelId}
              text={t("syncOnboarding.manual.pinContent.continueOnDevice", { productName })}
            />
          </Flex>
        ),
      },
      {
        key: StepKey.Seed,
        status: "inactive",
        title: t("syncOnboarding.manual.seedContent.title"),
        titleCompleted: t("syncOnboarding.manual.seedContent.titleCompleted"),
        renderBody: () => (
          <>
            <TrackPage
              category={`Set up ${productName}: Step 3 Seed Intro`}
              flow={analyticsFlowName}
            />
            <SeedStep seedPathStatus={seedPathStatus} deviceModelId={device.modelId} />
          </>
        ),
      },
      {
        key: StepKey.Applications,
        status: "inactive",
        hasLoader: hasAppLoader,
        title: t("syncOnboarding.manual.installApplications.title", { productName }),
        titleCompleted: t("syncOnboarding.manual.installApplications.titleCompleted", {
          productName,
        }),
        renderBody: () => (
          <OnboardingAppInstallStep
            device={device}
            deviceToRestore={shouldRestoreApps && deviceToRestore ? deviceToRestore : undefined}
            setHeaderLoader={(hasLoader: boolean) => setHasAppLoader(hasLoader)}
            onComplete={handleInstallRecommendedApplicationComplete}
            onError={handleInstallRecommendedApplicationComplete}
          />
        ),
      },
      {
        key: StepKey.Ready,
        status: "inactive",
        title: t("syncOnboarding.manual.endOfSetup.title"),
        titleCompleted: t("syncOnboarding.manual.endOfSetup.titleCompleted", {
          deviceName: productName,
        }),
      },
    ],
    [
      t,
      deviceName,
      productName,
      seedPathStatus,
      device,
      shouldRestoreApps,
      deviceToRestore,
      hasAppLoader,
      handleInstallRecommendedApplicationComplete,
    ],
  );

  const [steps, setSteps] = useState<Step[]>(defaultSteps);
  const [isPollingOn, setIsPollingOn] = useState<boolean>(true);

  const [desyncOverlayDelay, setDesyncOverlayDelay] = useState<number>(DESYNC_OVERLAY_DELAY_MS);
  const [isDesyncOverlayOpen, setIsDesyncOverlayOpen] = useState<boolean>(false);
  const [desyncTimeout, setDesyncTimeout] = useState<number>(DESYNC_TIMEOUT_MS);

  const {
    onboardingState: deviceOnboardingState,
    allowedError,
    fatalError,
    lockedDevice,
  } = useOnboardingStatePolling({
    getOnboardingStatePolling,
    device: device || null,
    pollingPeriodMs: POLLING_PERIOD_MS,
    stopPolling: !isPollingOn,
  });

  const handleDeviceReady = useCallback(() => {
    history.push("/onboarding/sync/completion");
  }, [history]);

  const handleDesyncTimerRunsOut = useCallback(() => {
    setIsDesyncOverlayOpen(false);
    onLostDevice();
    setIsPollingOn(false);
  }, [onLostDevice]);

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
    if (deviceInitiallyOnboarded.current === undefined)
      deviceInitiallyOnboarded.current = deviceOnboardingState.isOnboarded;
    if (
      !deviceOnboardingState.isOnboarded && // onboarding state flags can only be trusted for a non-onboarded/non-seeded device
      deviceOnboardingState.seedPhraseType
    )
      analyticsSeedPhraseType.current = deviceOnboardingState.seedPhraseType;
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
      lastCompanionStepKey.current <= StepKey.Seed &&
      stepKey > StepKey.Seed &&
      !analyticsSeedingTracked.current
    ) {
      trackPage(
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
    lastCompanionStepKey.current = stepKey;
  }, [productName, stepKey]);

  useEffect(() => {
    if (lockedDevice) {
      const props: LockedDeviceDrawerProps = {
        deviceModelId: device.modelId,
      };
      setDrawer(LockedDeviceDrawer, props, {
        forceDisableFocusTrap: true,
        preventBackdropClick: true,
      });
    }
    return () => setDrawer();
  }, [device.modelId, history, lockedDevice]);

  useEffect(() => {
    // When the device is seeded, there are 2 cases before triggering the application install step:
    // - the user came to the sync onboarding with an non-seeded device and did a full onboarding: onboarding flag `Ready`
    // - the user came to the sync onboarding with an already seeded device: onboarding flag `WelcomeScreen1`
    if (
      deviceOnboardingState?.isOnboarded &&
      [DeviceOnboardingStep.Ready, DeviceOnboardingStep.WelcomeScreen1].includes(
        deviceOnboardingState?.currentOnboardingStep,
      )
    ) {
      setStepKey(StepKey.Applications);
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
        setStepKey(StepKey.Paired);
        break;
      case DeviceOnboardingStep.SetupChoice:
        setStepKey(StepKey.Seed);
        setSeedPathStatus("choice_new_or_restore");
        break;
      case DeviceOnboardingStep.NewDevice:
      case DeviceOnboardingStep.NewDeviceConfirming:
        setShouldRestoreApps(false);
        setStepKey(StepKey.Seed);
        setSeedPathStatus("new_seed");
        analyticsSeedConfiguration.current = "new_seed";
        break;
      case DeviceOnboardingStep.SetupChoiceRestore:
        setStepKey(StepKey.Seed);
        setSeedPathStatus("choice_restore_direct_or_recover");
        break;
      case DeviceOnboardingStep.RestoreSeed:
        setShouldRestoreApps(true);
        setStepKey(StepKey.Seed);
        setSeedPathStatus("restore_seed");
        analyticsSeedConfiguration.current = "restore_seed";
        break;
      case DeviceOnboardingStep.RecoverRestore:
        setShouldRestoreApps(true);
        setStepKey(StepKey.Seed);
        setSeedPathStatus("recover_seed");
        analyticsSeedConfiguration.current = "recover_seed";
        break;
      case DeviceOnboardingStep.Pin:
        setStepKey(StepKey.Pin);
        break;
      default:
        break;
    }
  }, [deviceOnboardingState, notifySyncOnboardingShouldReset]);

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
        setDesyncOverlayDelay(LONG_DESYNC_OVERLAY_DELAY_MS);
        setDesyncTimeout(LONG_DESYNC_TIMEOUT_MS);
      }
    }
  }, [deviceOnboardingState]);

  useEffect(() => {
    if (stepKey >= StepKey.Applications) {
      setIsPollingOn(false);
    }

    if (stepKey === StepKey.Ready) {
      setStepKey(StepKey.Exit);
    }

    if (stepKey === StepKey.Exit) {
      trackPage(
        `Set up ${productName}: Final Step ${productName} is ready`,
        undefined,
        { flow: analyticsFlowName },
        true,
        true,
      );
      setTimeout(handleDeviceReady, READY_REDIRECT_DELAY_MS);
    }

    setSteps(
      defaultSteps.map(step => {
        const stepStatus =
          step.key > stepKey ? "inactive" : step.key < stepKey ? "completed" : "active";
        const title = (stepStatus === "completed" && step.titleCompleted) || step.title;

        return {
          ...step,
          title,
          status: stepStatus,
        };
      }),
    );
  }, [stepKey, defaultSteps, handleDeviceReady, productName]);

  // Fatal error from the polling is not recoverable automatically
  useEffect(() => {
    if (!fatalError) {
      return;
    }
    onLostDevice();
    setIsPollingOn(false);
  }, [fatalError, onLostDevice]);

  useEffect(() => {
    let desyncTimer: NodeJS.Timeout | null = null;

    if (allowedError && !(allowedError instanceof LockedDeviceError)) {
      setIsDesyncOverlayOpen(true);
      desyncTimer = setTimeout(handleDesyncTimerRunsOut, desyncTimeout);
    } else {
      // desyncTimer is cleared in the useEffect cleanup function
      setIsDesyncOverlayOpen(false);
    }

    return () => {
      if (desyncTimer) {
        clearTimeout(desyncTimer);
      }
    };
  }, [device, allowedError, handleDesyncTimerRunsOut, desyncTimeout]);

  useEffect(() => {
    if (seedPathStatus === "recover_seed" && recoverRestoreStaxPath) {
      const [pathname, search] = recoverRestoreStaxPath.split("?");
      dispatch(
        saveSettings({
          hasCompletedOnboarding: true,
        }),
      );
      history.push({
        pathname,
        search: search ? `?${search}` : undefined,
        state: { fromOnboarding: true },
      });
    }
  }, [dispatch, history, recoverRestoreStaxPath, seedPathStatus]);

  return (
    <Flex width="100%" height="100%" flexDirection="column" justifyContent="flex-start">
      <DesyncOverlay
        isOpen={isDesyncOverlayOpen}
        delay={desyncOverlayDelay}
        productName={productName}
      />
      <Flex
        height="100%"
        width="480px"
        flexDirection="column"
        justifyContent="flex-start"
        alignSelf="center"
        flexGrow={0}
        flexShrink={1}
      >
        <Text variant="h3Inter" fontSize="8" fontWeight="semiBold" mb="8">
          {t("syncOnboarding.manual.title", { deviceName })}
        </Text>
        <Box>
          <VerticalTimeline steps={steps} />
        </Box>
      </Flex>
    </Flex>
  );
};

export default SyncOnboardingCompanion;
