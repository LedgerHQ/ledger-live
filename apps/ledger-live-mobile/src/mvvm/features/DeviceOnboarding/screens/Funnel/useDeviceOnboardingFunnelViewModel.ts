import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
  type RouteProp,
} from "@react-navigation/native";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { knownDevicesSelector } from "~/reducers/knownDevices";
import type { ScreenName } from "~/const";
import type { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import {
  useDeviceOnboardingHost,
  useDeviceOnboardingSession,
} from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import { useOfferSync } from "LLM/features/DeviceOnboarding/hooks/useOfferSync";
import type { ChecksScreenProps } from "LLM/features/DeviceOnboarding/types";
import { toChecksError, toFirmwareUpdate } from "LLM/features/DeviceOnboarding/utils/checksPhase";
import { checksScreenForPhase, phaseOf } from "LLM/features/DeviceOnboarding/utils/funnelPhase";
import { selectPairedKnownDevices } from "LLM/features/DeviceOnboarding/utils/pairedDevice";
import { useFirmwareUpdateHandover } from "LLM/features/DeviceOnboarding/hooks/useFirmwareUpdateHandover";

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
  const knownDevices = useMemo(
    () => selectPairedKnownDevices(allKnownDevices, pairedDeviceId),
    [allKnownDevices, pairedDeviceId],
  );
  const offerSync = useOfferSync();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { t } = useTranslation();
  const allowLeave = useRef(false);
  const onLeave = useCallback(() => {
    allowLeave.current = true;
  }, []);
  const onboarding = useDeviceOnboardingSession();
  const host = useMemo(
    () => ({
      navigation,
      onLeave,
      dmk,
      knownDevices,
      offerSync,
      wasReadOnlyAtEntry,
    }),
    [dmk, knownDevices, navigation, offerSync, onLeave, wasReadOnlyAtEntry],
  );
  useDeviceOnboardingHost(host);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (onboarding.status !== "idle" || onboarding.state !== null || onboarding.error) return;
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

  const leave = useCallback(() => {
    allowLeave.current = true;
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

  const { close: closeFirmwareHandover } = useFirmwareUpdateHandover({
    device: onboarding.liveDevice,
    isDeviceOnboarded: onboarding.context?.isOnboarded ?? false,
    machineState: onboarding.state,
    currentSessionId: onboarding.device?.sessionId ?? null,
    send: onboarding.send,
    onReconnectRequired: onboarding.reconnectAfterUpdate,
  });

  const quitOrLeave = useCallback(() => {
    if (onboarding.status === "running" && onboarding.state) {
      quitMachine();
      return;
    }
    leave();
  }, [leave, onboarding.state, onboarding.status, quitMachine]);

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

  const onboardedOnEntry = onboarding.context?.onboardedOnEntry === true;
  const phase = phaseOf(onboarding.state, onboardedOnEntry);
  const screenState = checksScreenForPhase(
    phase,
    onboarding.state,
    onboarding.context?.checksPaused === true,
    onboardedOnEntry,
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
        onQuit: leaveFirmwareReconnect,
      };
    }
    return {
      status: "connecting",
      title: t("deviceOnboarding.connection.connecting"),
      closeLabel,
      onQuit: leaveFirmwareReconnect,
    };
  }

  if (onboarding.state === "awaitingSession") {
    return {
      status: "failed",
      title: t("deviceOnboarding.connection.failed"),
      retryLabel: t("common.retry"),
      closeLabel,
      onRetry: reconnect,
      onQuit: quitMachine,
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
        onQuit: quitOrLeave,
      };
    }
    return {
      status: "connecting",
      title: t("deviceOnboarding.connection.connecting"),
      closeLabel,
      onQuit: quitOrLeave,
    };
  }

  return {
    status: "checks",
    checks: {
      device,
      state: screenState,
      error: toChecksError(onboarding.state, readString(onboarding.context?.genuineFailureKind)),
      update:
        phase === "checks"
          ? toFirmwareUpdate(
              readString(onboarding.context?.firmwareVersion),
              readString(onboarding.context?.availableFirmwareVersion),
            )
          : null,
      firmwareUpToDate: onboarding.context?.firmwareUpToDate === true,
      onStart: () =>
        send({ type: onboarding.state === "checks.checksIdle" ? "RETRY" : "CONTINUE" }),
      onRetry: () => send({ type: "RETRY" }),
      onCloseSheet: () => send({ type: "CLOSE" }),
      onAcceptUpdate: () => send({ type: "USER_ACCEPT" }),
      onDeclineUpdate: () => send({ type: "USER_DECLINE" }),
      onContinue:
        onboarding.state === "checks.checksSucceeded"
          ? () => send({ type: "CONTINUE" })
          : undefined,
      onQuit:
        onboarding.state === firmwareUpdateDelegatedState ? closeFirmwareHandover : quitMachine,
    },
  };
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
