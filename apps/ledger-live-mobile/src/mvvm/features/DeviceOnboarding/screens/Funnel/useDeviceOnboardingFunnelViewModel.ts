import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type {
  DeviceOnboardingContext,
  DeviceOnboardingExitReason,
} from "@features/platform-device-onboarding";
import { seededButtons, seededPages } from "../../analytics/seededTracking";
import { useSeededFunnelTracking } from "../../analytics/useSeededFunnelTracking";
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
  const [firmwareUpdateDone, setFirmwareUpdateDone] = useState(false);
  const trackExitRef = useRef<
    (reason: DeviceOnboardingExitReason, context: DeviceOnboardingContext) => void
  >(() => undefined);
  const onboarding = useDeviceOnboarding({
    dmk,
    knownDevices,
    offerSync,
    navigateOnExit: true,
    wasReadOnlyAtEntry,
    firmwareUpdateDone,
    onLeave: (reason, context) => {
      allowLeave.current = true;
      trackExitRef.current(reason, context);
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

  const seededTracking = useSeededFunnelTracking({
    machineState: onboarding.state,
    context: onboarding.context,
    offerSync,
    firmwareUpdateDone,
  });
  useEffect(() => {
    trackExitRef.current = seededTracking.trackExit;
  }, [seededTracking.trackExit]);
  const { trackClick, trackAbort } = seededTracking;

  const leave = useCallback(() => {
    allowLeave.current = true;
    trackAbort();
    onboarding.reset();
    navigation.goBack();
  }, [navigation, onboarding, trackAbort]);

  const leaveFirmwareReconnect = useCallback(() => {
    allowLeave.current = true;
    onboarding.abortFirmwareReconnect();
  }, [onboarding]);

  const quitMachine = useCallback(() => {
    send({ type: "QUIT" });
  }, [send]);

  const closeFirmwareHandover = onboarding.closeFirmwareHandover;

  const closeFromHeader = useCallback(() => {
    trackClick(seededButtons.close);
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
    trackClick(seededButtons.close);
    quitMachine();
  }, [quitMachine, trackClick]);

  const closeFirmwareReconnect = useCallback(() => {
    trackClick(seededButtons.close);
    leaveFirmwareReconnect();
  }, [leaveFirmwareReconnect, trackClick]);

  const retry = useCallback(() => {
    onboarding.reset();
    onboarding.connect();
  }, [onboarding]);

  const reconnect = useCallback(() => {
    onboarding.connect();
  }, [onboarding]);

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
    onboarding.context?.onboardedOnEntry === true,
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
      firmwareUpToDate: onboarding.context?.firmwareUpToDate === true,
      onStart: () => {
        trackClick(seededButtons.initiateGenuineCheck);
        send({ type: onboarding.state === "checks.checksIdle" ? "RETRY" : "CONTINUE" });
      },
      onRetry: () => {
        if (seededTracking.page === seededPages.genuineCheckRefused) {
          trackClick(seededButtons.retryGenuineCheck);
        }
        send({ type: "RETRY" });
      },
      onCloseSheet: () => send({ type: "CLOSE" }),
      onAcceptUpdate: () => {
        setFirmwareUpdateDone(true);
        trackClick(seededButtons.continue);
        send({ type: "USER_ACCEPT" });
      },
      onDeclineUpdate: () => {
        trackClick(seededButtons.close);
        send({ type: "USER_DECLINE" });
      },
      onContinue:
        onboarding.state === "checks.checksSucceeded"
          ? () => {
              trackClick(seededButtons.continue);
              send({ type: "CONTINUE" });
            }
          : undefined,
      onUnsupportedUpdate: seededTracking.trackUnsupportedUpdate,
      onUnsupportedUpdateClosed: seededTracking.trackUnsupportedUpdateClosed,
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
