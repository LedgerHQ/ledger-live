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
import { seededButtons, seededFunnel, seededPages } from "../../analytics/seededTracking";
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
  const onboarding = useDeviceOnboarding({
    dmk,
    knownDevices,
    offerSync,
    navigateOnExit: true,
    wasReadOnlyAtEntry,
    onLeave: (reason, context) => {
      allowLeave.current = true;
      seededFunnel.exit(reason, context);
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

  useSeededFunnelTracking({
    machineState: onboarding.state,
    context: onboarding.context,
    offerSync,
  });

  const leave = useCallback(() => {
    allowLeave.current = true;
    seededFunnel.end("aborted");
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
    seededFunnel.click(seededButtons.close);
    if (onboarding.state === firmwareUpdateDelegatedState) {
      closeFirmwareHandover();
      return;
    }
    if (onboarding.status === "running" && onboarding.state) {
      quitMachine();
      return;
    }
    leave();
  }, [closeFirmwareHandover, leave, onboarding.state, onboarding.status, quitMachine]);

  const closeLostSession = useCallback(() => {
    seededFunnel.click(seededButtons.close);
    quitMachine();
  }, [quitMachine]);

  const closeFirmwareReconnect = useCallback(() => {
    seededFunnel.click(seededButtons.close);
    leaveFirmwareReconnect();
  }, [leaveFirmwareReconnect]);

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
        seededFunnel.click(seededButtons.initiateGenuineCheck);
        send({ type: onboarding.state === "checks.checksIdle" ? "RETRY" : "CONTINUE" });
      },
      onRetry: () => {
        if (seededFunnel.currentPage() === seededPages.genuineCheckRefused) {
          seededFunnel.click(seededButtons.retryGenuineCheck);
        }
        send({ type: "RETRY" });
      },
      onCloseSheet: () => send({ type: "CLOSE" }),
      onAcceptUpdate: () => {
        seededFunnel.learn({ firmwareUpdateDone: true });
        seededFunnel.click(seededButtons.continue);
        send({ type: "USER_ACCEPT" });
      },
      onDeclineUpdate: () => {
        seededFunnel.click(seededButtons.close);
        send({ type: "USER_DECLINE" });
      },
      onContinue:
        onboarding.state === "checks.checksSucceeded"
          ? () => {
              seededFunnel.click(seededButtons.continue);
              send({ type: "CONTINUE" });
            }
          : undefined,
      onUnsupportedUpdate: usbRequired =>
        seededFunnel.openDrawer(seededPages.osUpdateUnsupported, {
          reason: usbRequired ? "usb_required" : "not_eligible",
        }),
      onUnsupportedUpdateClosed: seededFunnel.closeDrawer,
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
