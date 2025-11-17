import React, { useEffect, useState, useCallback, useRef } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";

import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useDispatch, useSelector } from "react-redux";

import { NavigatorName, ScreenName } from "~/const";
import HelpDrawer from "../HelpDrawer";
import DesyncOverlay from "../DesyncOverlay";

import type { SyncOnboardingScreenProps } from "../SyncOnboardingScreenProps";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useKeepScreenAwake } from "~/hooks/useKeepScreenAwake";
import useTwoStepDesync from "./useTwoStepDesync";
import {
  completeOnboarding,
  setHasOrderedNano,
  setIsOnboardingFlow,
  setIsOnboardingFlowReceiveSuccess,
  setReadOnlyMode,
} from "~/actions/settings";
import FirstStepSyncOnboarding from "./FirstStepSyncOnboarding";
import SecondStepSyncOnboarding from "./SecondStepSyncOnboarding";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { TrackScreen } from "~/analytics";
import { RootNavigation } from "~/components/RootNavigator/types/helpers";
import { SeedOriginType } from "@ledgerhq/types-live";
import { COMPANION_STATE, CompanionStep, SEED_STATE } from "./types";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { isOnboardingFlowReceiveSuccessSelector } from "~/reducers/settings";

/*
 * Constants
 */

const READY_REDIRECT_DELAY_MS = 2500;

/*
 * Types
 */

export type TwoStepSyncOnboardingCompanionProps = {
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

/**
 * Component representing the synchronous companion step, which polls the current device state
 * to display correctly information about the onboarding to the user
 *
 * The desync alert message overlay is rendered from this component to better handle relative position
 * with the vertical timeline.
 */

export const TwoStepSyncOnboardingCompanion: React.FC<TwoStepSyncOnboardingCompanionProps> = ({
  navigation,
  device,
  updateHeaderOverlayDelay,
  onShouldHeaderBeOverlaid,
  onLostDevice,
  notifyEarlySecurityCheckShouldReset,
}) => {
  const baseNavigation = useNavigation<RootNavigation>();
  const { t } = useTranslation();
  /*
   * Local State
   */
  const [companionStep, setCompanionStep] = useState<CompanionStep>(COMPANION_STATE.SETUP);
  const [isHelpDrawerOpen, setHelpDrawerOpen] = useState<boolean>(false);
  const [isPollingOn, setIsPollingOn] = useState<boolean>(true);
  const [isInitialised, setIsInitialised] = useState<boolean>(false);
  /*
   * Refs
   */
  const readyRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preventNavigation = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const analyticsSeedConfiguration = useRef<SeedOriginType>();

  /*
   * Redux State
   */
  const dispatchRedux = useDispatch();
  const isOnboardingFlowReceiveSuccess = useSelector(isOnboardingFlowReceiveSuccessSelector);

  /*
   * Custom hooks/state
   */
  const isFocused = useIsFocused();
  useKeepScreenAwake(isFocused);
  const productName = getDeviceModel(device.modelId).productName || device.modelId;

  const { handleOpenReceiveDrawer, isModularDrawerEnabled } = useOpenReceiveDrawer({
    sourceScreenName: "sync-onboarding-companion",
    navigationOverride: baseNavigation,
  });

  const twoStepDesync = useTwoStepDesync({
    onLostDevice,
    onShouldHeaderBeOverlaid,
    updateHeaderOverlayDelay,
    setIsPollingOn,
  });

  /*
   * Callbacks
   */
  const handleOnboardingDoneState = useCallback(() => {
    dispatchRedux(setReadOnlyMode(false));
    dispatchRedux(setHasOrderedNano(false));
    dispatchRedux(completeOnboarding());
  }, [dispatchRedux]);
  /**
   * Triggers the end of the onboarding
   */
  const handleOnboardingDone = useCallback(() => {
    handleOnboardingDoneState();
    navigation.navigate(ScreenName.SyncOnboardingCompletion, {
      device,
      seedConfiguration: analyticsSeedConfiguration.current,
    });
  }, [device, navigation, handleOnboardingDoneState]);

  const handleReceiveFlowSuccess = useCallback(() => {
    dispatchRedux(setIsOnboardingFlowReceiveSuccess(false));
    handleOnboardingDoneState();
    baseNavigation.reset({
      index: 0,
      routes: [
        {
          name: NavigatorName.BaseOnboarding,
          state: {
            routes: [
              {
                name: NavigatorName.SyncOnboarding,
                state: {
                  routes: [
                    {
                      name: ScreenName.SyncOnboardingCompletion,
                      params: {
                        device,
                        seedConfiguration: analyticsSeedConfiguration.current,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  }, [dispatchRedux, baseNavigation, device, handleOnboardingDoneState]);

  const handleSecondStepFinish = useCallback(
    (done: boolean) => {
      if (!done) {
        handleOnboardingDone();
      } else if (companionStep === SEED_STATE.NEW_SEED) {
        dispatchRedux(setIsOnboardingFlow(true));

        if (isModularDrawerEnabled) {
          // No genericity or extraction because we will remove the other code block once we fully migrate to the modular drawer.
          handleOpenReceiveDrawer();
        } else {
          baseNavigation.reset({
            index: 1,
            routes: [
              {
                name: NavigatorName.BaseOnboarding,
                state: {
                  routes: [
                    {
                      name: NavigatorName.SyncOnboarding,
                      state: {
                        routes: [
                          {
                            name: ScreenName.SyncOnboardingCompletion,
                            params: {
                              device,
                              seedConfiguration: analyticsSeedConfiguration.current,
                            },
                          },
                        ],
                      },
                    },
                    {
                      name: NavigatorName.ReceiveFunds,
                      state: {
                        routes: [
                          {
                            name: ScreenName.ReceiveSelectCrypto,
                            params: {
                              device,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          });
        }
      } else {
        setCompanionStep(COMPANION_STATE.EXIT);
      }
    },
    [
      companionStep,
      setCompanionStep,
      baseNavigation,
      device,
      handleOnboardingDone,
      dispatchRedux,
      isModularDrawerEnabled,
      handleOpenReceiveDrawer,
    ],
  );
  /*
   * useEffects
   */

  useEffect(() => {
    navigation.addListener("beforeRemove", e => {
      if (preventNavigation.current) e.preventDefault();
    });
  }, [navigation]);

  // Handle exit status
  useEffect(() => {
    if (companionStep === COMPANION_STATE.EXIT) {
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
  }, [companionStep, handleOnboardingDone]);

  useEffect(() => {
    if (!isInitialised) {
      if (isOnboardingFlowReceiveSuccess) dispatchRedux(setIsOnboardingFlowReceiveSuccess(false));
      setIsInitialised(true);
    } else if (isOnboardingFlowReceiveSuccess) {
      handleReceiveFlowSuccess();
    }
  }, [isOnboardingFlowReceiveSuccess, handleReceiveFlowSuccess, dispatchRedux, isInitialised]);

  return (
    <>
      <HelpDrawer isOpen={isHelpDrawerOpen} onClose={() => setHelpDrawerOpen(false)} />
      <Flex position="relative" flex={1} px={6}>
        <DesyncOverlay
          isOpen={twoStepDesync.isDesyncOverlayOpen}
          delay={twoStepDesync.desyncOverlayDisplayDelayMs}
          productName={productName}
        />
        <ScrollView showsVerticalScrollIndicator={false} ref={scrollViewRef}>
          <Flex paddingBottom={10}>
            <Text variant="h4" fontWeight="semiBold">
              {t("syncOnboarding.twoStepTitle")}
            </Text>
            <FirstStepSyncOnboarding
              device={device}
              productName={productName}
              navigation={navigation}
              onLostDevice={onLostDevice}
              handleSeedGenerationDelay={twoStepDesync.handleSeedGenerationDelay}
              notifyEarlySecurityCheckShouldReset={notifyEarlySecurityCheckShouldReset}
              handlePollingError={twoStepDesync.handlePollingError}
              handleFinishStep={(nextStep: SEED_STATE) => setCompanionStep(nextStep)}
              isPollingOn={isPollingOn}
              setIsPollingOn={setIsPollingOn}
              parentRef={scrollViewRef}
              analyticsSeedConfiguration={analyticsSeedConfiguration}
            />
            <SecondStepSyncOnboarding
              companionStep={companionStep}
              device={device}
              handleDone={handleSecondStepFinish}
              analyticsSeedConfiguration={analyticsSeedConfiguration}
            />
            {companionStep === SEED_STATE.NEW_SEED || companionStep === SEED_STATE.RESTORE ? (
              <TrackScreen
                category="Set up device: Secure your crypto"
                flow="onboarding"
                seedConfiguration={analyticsSeedConfiguration.current}
              />
            ) : null}
          </Flex>
        </ScrollView>
      </Flex>
    </>
  );
};
