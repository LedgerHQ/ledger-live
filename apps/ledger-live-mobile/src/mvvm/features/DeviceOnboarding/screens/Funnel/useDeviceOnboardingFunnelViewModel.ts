import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
  type RouteProp,
} from "@react-navigation/native";
import {
  USB_COMPAT_DEVICE_ID_PREFIX,
  isUsbCompatDeviceId,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { knownDevicesSelector } from "~/reducers/knownDevices";
import type { ScreenName } from "~/const";
import type { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import type { ChecksScreenProps } from "LLM/features/DeviceOnboarding/types";
import {
  markFirmwareUpdateAccepted,
  rememberSeededOnboarding,
  resetSeededOnboardingAnalytics,
  seededButtons,
  seededCheckPage,
  seededPages,
  trackSeededChecksSuccess,
  trackSeededClick,
  trackSeededOnboardingAborted,
  trackSeededOnboardingStarted,
  trackSeededPage,
} from "../../analytics/seededTracking";
import { useDeviceOnboarding } from "../../hooks/useDeviceOnboarding";
import { useOfferSync } from "../../hooks/useOfferSync";
import { toChecksError, toChecksScreenState, toFirmwareUpdate } from "../../utils/checksPhase";

type FunnelRoute = RouteProp<OnboardingNavigatorParamList, ScreenName.DeviceOnboardingFunnel>;

const firmwareUpdateDelegatedState = "checks.firmwareUpdateDelegated";
const awaitingSessionAfterFirmwareUpdateState = "awaitingSessionAfterFirmwareUpdate";

/** Back must not quit here: a quit would skip the update and complete onboarding. */
const firmwareUpdateOfferState = "checks.firmwareUpdateOffered";

export type DeviceOnboardingFunnelModel =
  | { status: "checks"; checks: ChecksScreenProps }
  | { status: "connecting"; title: string; closeLabel: string; onQuit: () => void }
  | {
      status: "failed";
      title: string;
      retryLabel: string;
      closeLabel: string;
      onRetry: () => void;
      onQuit: () => void;
    };

export function useDeviceOnboardingFunnelViewModel(): DeviceOnboardingFunnelModel {
  const dmk = useDeviceManagementKit();
  const allKnownDevices = useSelector(knownDevicesSelector);
  const { pairedDeviceId, wasReadOnlyAtEntry } = useRoute<FunnelRoute>().params;
  const knownDevices = useMemo(() => {
    const paired = allKnownDevices.filter(known => matchesPairedDevice(known.id, pairedDeviceId));
    return paired.length > 0 ? paired : allKnownDevices;
  }, [allKnownDevices, pairedDeviceId]);
  const offerSync = useOfferSync();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { t } = useTranslation();
  const allowLeave = useRef(false);
  const onboarding = useDeviceOnboarding({
    dmk,
    knownDevices,
    offerSync,
    navigateOnExit: true,
    wasReadOnlyAtEntry,
    onLeave: () => {
      allowLeave.current = true;
    },
  });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    onboarding.connect();
  }, [onboarding]);

  const sessionReady = onboarding.sendableEvents.some(
    ({ event }) => event.type === "SESSION_READY",
  );
  const send = onboarding.send;

  useEffect(() => {
    if (!sessionReady) return;
    send({ type: "SESSION_READY" });
  }, [send, sessionReady]);

  const pageRef = useRef<string | null>(null);
  const analyticsAttempt = useRef(false);
  const seededOnEntry = readSeededOnEntry(onboarding.context);
  const page = seededOnEntry
    ? seededCheckPage(
        onboarding.state,
        onboarding.context?.checksPaused === true,
        readString(onboarding.context?.genuineFailureKind),
      )
    : null;

  const trackClick = useCallback(
    (button: string, pageName?: string | null) => {
      if (!readSeededOnEntry(onboarding.context)) return;
      void trackSeededClick(button, pageName);
    },
    [onboarding.context],
  );

  const leave = useCallback(() => {
    allowLeave.current = true;
    if (readSeededOnEntry(onboarding.context)) void trackSeededOnboardingAborted();
    onboarding.reset();
    navigation.goBack();
  }, [navigation, onboarding]);

  const leaveFirmwareReconnect = useCallback(() => {
    allowLeave.current = true;
    onboarding.abortFirmwareReconnect();
  }, [onboarding]);

  const quitMachine = useCallback(() => {
    send({ type: "QUIT" });
  }, [send]);

  const closeFirmwareHandover = onboarding.closeFirmwareHandover;

  const closeFromHeader = useCallback(() => {
    trackClick(seededButtons.close, pageRef.current);
    if (onboarding.state === firmwareUpdateDelegatedState) {
      closeFirmwareHandover();
      return;
    }
    if (onboarding.status === "running" && onboarding.state) {
      quitMachine();
      return;
    }
    leave();
  }, [closeFirmwareHandover, leave, onboarding.state, onboarding.status, quitMachine, trackClick]);

  const closeLostSession = useCallback(() => {
    trackClick(seededButtons.close, pageRef.current);
    quitMachine();
  }, [quitMachine, trackClick]);

  const closeFirmwareReconnect = useCallback(() => {
    trackClick(seededButtons.close, pageRef.current);
    leaveFirmwareReconnect();
  }, [leaveFirmwareReconnect, trackClick]);

  const retry = useCallback(() => {
    onboarding.reset();
    onboarding.connect();
  }, [onboarding]);

  const reconnect = useCallback(() => {
    onboarding.connect();
  }, [onboarding]);

  useEffect(() => {
    if (page) pageRef.current = page;
  }, [page]);

  useEffect(() => {
    if (!analyticsAttempt.current) {
      analyticsAttempt.current = true;
      resetSeededOnboardingAnalytics();
    }
    if (!seededOnEntry) return;
    rememberSeededOnboarding({
      ledgerSyncEligible: offerSync,
      deviceType: onboarding.liveDevice?.modelId ?? onboarding.context?.deviceModelId,
      deviceVersion: readString(onboarding.context?.firmwareVersion),
      updateOffered: Boolean(readString(onboarding.context?.availableFirmwareVersion)),
      firmwareChecked: onboarding.context?.firmwareChecked === true,
    });
    void trackSeededOnboardingStarted();
  }, [offerSync, onboarding.context, onboarding.liveDevice, seededOnEntry]);

  useEffect(() => {
    if (!page) return;
    if (page === seededPages.checksSuccess) {
      trackSeededChecksSuccess();
      return;
    }
    void trackSeededPage(page);
  }, [page]);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", event => {
        if (allowLeave.current) return;
        const action = event.data.action.type;
        if (action !== "GO_BACK" && action !== "POP") return;
        event.preventDefault();
        if (onboarding.state === awaitingSessionAfterFirmwareUpdateState) {
          leaveFirmwareReconnect();
          return;
        }
        if (onboarding.status === "running" && onboarding.state) {
          if (onboarding.state === firmwareUpdateDelegatedState) closeFirmwareHandover();
          else if (onboarding.state !== firmwareUpdateOfferState) quitMachine();
          return;
        }
        leave();
      }),
    [
      closeFirmwareHandover,
      leave,
      leaveFirmwareReconnect,
      navigation,
      onboarding.state,
      onboarding.status,
      quitMachine,
    ],
  );

  const screenState = toChecksScreenState(
    onboarding.state,
    onboarding.context?.checksPaused === true,
  );
  const device = onboarding.liveDevice;
  const closeLabel = t("deviceOnboarding.checks.close");

  if (onboarding.state === awaitingSessionAfterFirmwareUpdateState) {
    if (onboarding.error) {
      return {
        status: "failed",
        title: t("deviceOnboarding.connection.failed"),
        retryLabel: t("common.retry"),
        closeLabel,
        onRetry: reconnect,
        onQuit: closeFirmwareReconnect,
      };
    }
    return {
      status: "connecting",
      title: t("deviceOnboarding.connection.connecting"),
      closeLabel,
      onQuit: closeFirmwareReconnect,
    };
  }

  if (onboarding.state === "awaitingSession") {
    return {
      status: "failed",
      title: t("deviceOnboarding.connection.failed"),
      retryLabel: t("common.retry"),
      closeLabel,
      onRetry: reconnect,
      onQuit: closeLostSession,
    };
  }

  if (!device || !screenState) {
    if (onboarding.error) {
      return {
        status: "failed",
        title: t("deviceOnboarding.connection.failed"),
        retryLabel: t("common.retry"),
        closeLabel,
        onRetry: retry,
        onQuit: closeFromHeader,
      };
    }
    return {
      status: "connecting",
      title: t("deviceOnboarding.connection.connecting"),
      closeLabel,
      onQuit: closeFromHeader,
    };
  }

  return {
    status: "checks",
    checks: {
      device,
      state: screenState,
      error: toChecksError(onboarding.state, readString(onboarding.context?.genuineFailureKind)),
      update: toFirmwareUpdate(
        readString(onboarding.context?.firmwareVersion),
        readString(onboarding.context?.availableFirmwareVersion),
      ),
      onStart: () => {
        trackClick(seededButtons.initiateGenuineCheck, pageRef.current);
        send({ type: onboarding.state === "checks.checksIdle" ? "RETRY" : "CONTINUE" });
      },
      onRetry: () => {
        if (pageRef.current === seededPages.genuineCheckRefused) {
          trackClick(seededButtons.retryGenuineCheck, pageRef.current);
        }
        send({ type: "RETRY" });
      },
      onCloseSheet: () => send({ type: "CLOSE" }),
      onAcceptUpdate: () => {
        if (seededOnEntry) markFirmwareUpdateAccepted();
        trackClick(seededButtons.continueUpdate, pageRef.current);
        send({ type: "USER_ACCEPT" });
      },
      onDeclineUpdate: () => {
        trackClick(seededButtons.close, seededPages.osUpdateRequired);
        send({ type: "USER_DECLINE" });
      },
      onContinue:
        onboarding.state === "checks.checksSucceeded"
          ? () => {
              trackClick(seededButtons.continueUpdate, seededPages.checksSuccess);
              send({ type: "CONTINUE" });
            }
          : undefined,
      onQuit: closeFromHeader,
    },
  };
}

function matchesPairedDevice(knownId: string, pairedDeviceId: string | undefined) {
  if (!pairedDeviceId) return false;
  if (knownId === pairedDeviceId) return true;
  const discoveryId = isUsbCompatDeviceId(pairedDeviceId)
    ? pairedDeviceId.slice(USB_COMPAT_DEVICE_ID_PREFIX.length)
    : pairedDeviceId;
  return knownId === discoveryId;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readSeededOnEntry(context: unknown): boolean {
  if (!context || typeof context !== "object" || !("onboardedOnEntry" in context)) return false;
  return context.onboardedOnEntry === true;
}
