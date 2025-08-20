import React, { useEffect, useState, useCallback, useRef } from "react";
import { Flex } from "@ledgerhq/native-ui";

import { getDeviceModel } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useDispatch } from "react-redux";

import { ScreenName } from "~/const";
import HelpDrawer from "../HelpDrawer";
import DesyncOverlay from "../DesyncOverlay";
// import { TrackScreen } from "~/analytics";

import type { SyncOnboardingScreenProps } from "../SyncOnboardingScreenProps";
import { useIsFocused } from "@react-navigation/native";
import { useKeepScreenAwake } from "~/hooks/useKeepScreenAwake";
import useTwoStepDesync from "./useTwoStepDesync";
import { completeOnboarding, setHasOrderedNano, setReadOnlyMode } from "~/actions/settings";
import FirstStepSyncOnboarding from "./FirstStepSyncOnboarding";
import SecondStepSyncOnboarding from "./SecondStepSyncOnboarding";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import { ScrollView } from "react-native";
import { TrackScreen } from "~/analytics";

/*
 * Constants
 */

const READY_REDIRECT_DELAY_MS = 2500;

/*
 * Types
 */
export type ExitState = "new_seed" | "restore" | "exit";
export type CompanionStep = "setup" | ExitState;

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
  const { t } = useTranslation();
  /*
   * Local State
   */
  const [companionStep, setCompanionStep] = useState<CompanionStep>("setup");
  const [isHelpDrawerOpen, setHelpDrawerOpen] = useState<boolean>(false);
  const [isPollingOn, setIsPollingOn] = useState<boolean>(true);

  /*
   * Refs
   */
  const readyRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preventNavigation = useRef(false);

  /*
   * Redux State
   */
  const dispatchRedux = useDispatch();

  /*
   * Custom hooks/state
   */
  const isFocused = useIsFocused();
  useKeepScreenAwake(isFocused);
  const productName = getDeviceModel(device.modelId).productName || device.modelId;

  const twoStepDesync = useTwoStepDesync({
    onLostDevice,
    onShouldHeaderBeOverlaid,
    updateHeaderOverlayDelay,
    setIsPollingOn,
  });

  /*
   * Callbacks
   */

  /**
   * Triggers the end of the onboarding
   */
  const handleOnboardingDone = useCallback(() => {
    dispatchRedux(setReadOnlyMode(false));
    dispatchRedux(setHasOrderedNano(false));
    dispatchRedux(completeOnboarding());
    navigation.navigate(ScreenName.SyncOnboardingCompletion, { device });
  }, [device, dispatchRedux, navigation]);

  /*
   * useEffects
   */

  useEffect(
    () =>
      navigation.addListener("beforeRemove", e => {
        if (preventNavigation.current) e.preventDefault();
      }),
    [navigation],
  );

  // Handle exit status
  useEffect(() => {
    if (companionStep === "exit") {
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

  return (
    <>
      <HelpDrawer isOpen={isHelpDrawerOpen} onClose={() => setHelpDrawerOpen(false)} />
      <Flex position="relative" flex={1} px={6}>
        <DesyncOverlay
          isOpen={twoStepDesync.isDesyncOverlayOpen}
          delay={twoStepDesync.desyncOverlayDisplayDelayMs}
          productName={productName}
        />
        <ScrollView showsVerticalScrollIndicator={false}>
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
              handleFinishStep={(nextStep: ExitState) => setCompanionStep(nextStep)}
              isCollapsed={companionStep !== "setup"}
              isPollingOn={isPollingOn}
              setIsPollingOn={setIsPollingOn}
            />
            <SecondStepSyncOnboarding
              companionStep={companionStep}
              isCollapsed={companionStep === "setup" || companionStep === "exit"}
              device={device}
              handleDone={() => setCompanionStep("exit")}
            />
            {companionStep === "exit" ? (
              <TrackScreen category="Set up device: Final Step Your device is ready" />
            ) : null}
          </Flex>
        </ScrollView>
      </Flex>
    </>
  );
};
