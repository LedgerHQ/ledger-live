import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { lastSavedStepName } from "LLM/features/DeviceOnboarding/components/QuitConfirmation/lastSavedStep";
import {
  useDeviceOnboardingHost,
  useDeviceOnboardingSession,
} from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import { useFirmwareUpdateHandover } from "LLM/features/DeviceOnboarding/hooks/useFirmwareUpdateHandover";
import { useOfferSync } from "LLM/features/DeviceOnboarding/hooks/useOfferSync";
import type { SetupScreenProps } from "LLM/features/DeviceOnboarding/screens/Setup/types";
import type { ChecksScreenProps } from "LLM/features/DeviceOnboarding/types";
import { toChecksError, toFirmwareUpdate } from "LLM/features/DeviceOnboarding/utils/checksPhase";
import { checksScreenForPhase, phaseOf } from "LLM/features/DeviceOnboarding/utils/funnelPhase";
import { selectPairedKnownDevices } from "LLM/features/DeviceOnboarding/utils/pairedDevice";
import { useUnseededFunnelViewModel } from "./useUnseededFunnelViewModel";

type FunnelRoute = RouteProp<OnboardingNavigatorParamList, ScreenName.DeviceOnboardingFunnel>;

const firmwareUpdateDelegatedState = "checks.firmwareUpdateDelegated";
const awaitingSessionAfterFirmwareUpdateState = "awaitingSessionAfterFirmwareUpdate";

/** Back must not quit here: a quit would skip the update and complete onboarding. */
const firmwareUpdateOfferState = "checks.firmwareUpdateOffered";

export type QuitConfirmationModel = {
  isOpen: boolean;
  stepName: string;
  onContinue: () => void;
  onLeave: () => void;
};

export type DeviceOnboardingFunnelModel = (
  | { status: "karaoke"; onClose: () => void }
  | { status: "checks"; checks: ChecksScreenProps }
  | { status: "setup"; setup: SetupScreenProps }
  | { status: "connecting"; title: string; closeLabel: string; onQuit: () => void }
  | {
      status: "failed";
      title: string;
      retryLabel: string;
      closeLabel: string;
      onRetry: () => void;
      onQuit: () => void;
    }
) & { quitConfirmation: QuitConfirmationModel | null };

type BackEvent = {
  preventDefault: () => void;
  data: { action: { type: string } };
};

type LeaveActions = {
  allowLeave: boolean;
  state: string | null;
  status: string;
  unseeded: boolean;
  leaveFirmwareReconnect: () => void;
  closeFirmwareHandover: () => void;
  requestQuit: () => void;
  quitMachine: () => void;
  leave: () => void;
};

function blockBack(event: BackEvent, actions: LeaveActions) {
  if (actions.allowLeave) return;
  const action = event.data.action.type;
  if (action !== "GO_BACK" && action !== "POP") return;
  event.preventDefault();
  if (actions.state === awaitingSessionAfterFirmwareUpdateState) {
    actions.leaveFirmwareReconnect();
    return;
  }
  if (actions.status === "running" && actions.state) {
    if (actions.state === firmwareUpdateDelegatedState) actions.closeFirmwareHandover();
    else if (actions.unseeded) actions.requestQuit();
    else if (actions.state !== firmwareUpdateOfferState) actions.quitMachine();
    return;
  }
  actions.leave();
}

function quitOrLeaveSession(actions: LeaveActions) {
  if (actions.status === "running" && actions.state) {
    if (actions.unseeded) {
      actions.requestQuit();
      return;
    }
    actions.quitMachine();
    return;
  }
  actions.leave();
}

type ScreenCopy = {
  failedTitle: string;
  connectingTitle: string;
  retryLabel: string;
  closeLabel: string;
};

type ScreenActions = {
  state: string | null;
  error: string | null;
  device: ChecksScreenProps["device"] | null;
  screenState: ChecksScreenProps["state"] | null;
  phase: ReturnType<typeof phaseOf>;
  unseeded: boolean;
  quitConfirmation: QuitConfirmationModel | null;
  copy: ScreenCopy;
  retry: () => void;
  reconnect: () => void;
  leaveFirmwareReconnect: () => void;
  quitOrLeave: () => void;
  leaveFromHeader: () => void;
  requestQuit: () => void;
  closeFirmwareHandover: () => void;
  send: (event: { type: "RETRY" | "CONTINUE" | "CLOSE" | "USER_ACCEPT" | "USER_DECLINE" }) => void;
  firmwareVersion: string | null;
  availableFirmwareVersion: string | null;
  firmwareUpToDate: boolean;
  genuineFailureKind: string | null;
};

function failedScreen(
  copy: ScreenCopy,
  onRetry: () => void,
  onQuit: () => void,
  quitConfirmation: QuitConfirmationModel | null,
): DeviceOnboardingFunnelModel {
  return {
    status: "failed",
    title: copy.failedTitle,
    retryLabel: copy.retryLabel,
    closeLabel: copy.closeLabel,
    onRetry,
    onQuit,
    quitConfirmation,
  };
}

function connectingScreen(
  copy: ScreenCopy,
  onQuit: () => void,
  quitConfirmation: QuitConfirmationModel | null,
): DeviceOnboardingFunnelModel {
  return {
    status: "connecting",
    title: copy.connectingTitle,
    closeLabel: copy.closeLabel,
    onQuit,
    quitConfirmation,
  };
}

function earlyScreen(actions: ScreenActions): DeviceOnboardingFunnelModel | null {
  const { copy, quitConfirmation } = actions;
  if (actions.state === awaitingSessionAfterFirmwareUpdateState) {
    if (actions.error) {
      return failedScreen(
        copy,
        actions.reconnect,
        actions.leaveFirmwareReconnect,
        quitConfirmation,
      );
    }
    return connectingScreen(copy, actions.leaveFirmwareReconnect, quitConfirmation);
  }
  if (actions.state === "awaitingSession") {
    return failedScreen(copy, actions.reconnect, actions.leaveFromHeader, quitConfirmation);
  }
  if (!actions.device || !actions.screenState) {
    if (actions.error) {
      return failedScreen(copy, actions.retry, actions.quitOrLeave, quitConfirmation);
    }
    return connectingScreen(copy, actions.quitOrLeave, quitConfirmation);
  }
  return null;
}

function checksScreen(actions: ScreenActions): DeviceOnboardingFunnelModel {
  const device = actions.device;
  const screenState = actions.screenState;
  if (!device || !screenState) {
    return connectingScreen(actions.copy, actions.quitOrLeave, actions.quitConfirmation);
  }
  if (actions.unseeded && actions.state === "awaitingStart") {
    return {
      status: "karaoke",
      onClose: actions.requestQuit,
      quitConfirmation: actions.quitConfirmation,
    };
  }
  const startEvent = actions.state === "checks.checksIdle" ? "RETRY" : "CONTINUE";
  return {
    status: "checks",
    quitConfirmation: actions.quitConfirmation,
    checks: {
      device,
      state: screenState,
      error: toChecksError(actions.state, actions.genuineFailureKind),
      update:
        actions.phase === "checks"
          ? toFirmwareUpdate(actions.firmwareVersion, actions.availableFirmwareVersion)
          : null,
      firmwareUpToDate: actions.firmwareUpToDate,
      onStart: () => actions.send({ type: startEvent }),
      onRetry: () => actions.send({ type: "RETRY" }),
      onCloseSheet: () => actions.send({ type: "CLOSE" }),
      onCloseNotGenuine: actions.unseeded ? () => actions.send({ type: "CLOSE" }) : undefined,
      onCloseFirmwareOffer: actions.unseeded ? () => actions.send({ type: "CLOSE" }) : undefined,
      onAcceptUpdate: () => actions.send({ type: "USER_ACCEPT" }),
      onDeclineUpdate: () => actions.send({ type: "USER_DECLINE" }),
      onContinue:
        actions.state === "checks.checksSucceeded"
          ? () => actions.send({ type: "CONTINUE" })
          : undefined,
      onQuit:
        actions.state === firmwareUpdateDelegatedState
          ? actions.closeFirmwareHandover
          : actions.leaveFromHeader,
    },
  };
}

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
  const quitSent = useRef(false);
  const [quitConfirmationOpen, setQuitConfirmationOpen] = useState(false);
  const [setupLeaveRequest, setSetupLeaveRequest] = useState(0);
  const [setupVisible, setSetupVisible] = useState(false);
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

  const requestQuit = useCallback(() => {
    if (setupVisible) {
      setSetupLeaveRequest(request => request + 1);
      return;
    }
    setQuitConfirmationOpen(true);
  }, [setupVisible]);

  const continueSetup = useCallback(() => {
    setQuitConfirmationOpen(false);
  }, []);

  const leaveWithoutSaving = useCallback(() => {
    if (quitSent.current) return;
    quitSent.current = true;
    setQuitConfirmationOpen(false);
    send({ type: "QUIT" });
  }, [send]);

  const unseeded = onboarding.context?.onboardedOnEntry === false;

  const quitOrLeave = useCallback(() => {
    quitOrLeaveSession({
      allowLeave: allowLeave.current,
      state: onboarding.state,
      status: onboarding.status,
      unseeded,
      leaveFirmwareReconnect,
      closeFirmwareHandover,
      requestQuit,
      quitMachine,
      leave,
    });
  }, [
    closeFirmwareHandover,
    leave,
    leaveFirmwareReconnect,
    onboarding.state,
    onboarding.status,
    quitMachine,
    requestQuit,
    unseeded,
  ]);

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
        blockBack(event, {
          allowLeave: allowLeave.current,
          state: onboarding.state,
          status: onboarding.status,
          unseeded,
          leaveFirmwareReconnect,
          closeFirmwareHandover,
          requestQuit,
          quitMachine,
          leave,
        });
      }),
    [
      closeFirmwareHandover,
      leave,
      leaveFirmwareReconnect,
      navigation,
      onboarding.state,
      onboarding.status,
      quitMachine,
      requestQuit,
      unseeded,
    ],
  );

  const unseededSetup = useUnseededFunnelViewModel({
    machineState: onboarding.state,
    onboardedOnEntry: onboarding.context?.onboardedOnEntry ?? null,
    currentStep: onboarding.context?.currentOnboardingStep ?? null,
    checksPaused: onboarding.context?.checksPaused === true,
    genuineFailureKind: readString(onboarding.context?.genuineFailureKind),
    firmwareVersion: readString(onboarding.context?.firmwareVersion),
    availableFirmwareVersion: readString(onboarding.context?.availableFirmwareVersion),
    device: onboarding.liveDevice,
    firmwareUpToDate: onboarding.context?.firmwareUpToDate === true,
    send,
    closeFirmwareHandover,
  });
  if ((unseededSetup !== null) !== setupVisible) setSetupVisible(unseededSetup !== null);

  const onboardedOnEntry = onboarding.context?.onboardedOnEntry ?? null;
  const phase = phaseOf(onboarding.state, onboardedOnEntry);
  const screenState = checksScreenForPhase(
    phase,
    onboarding.state,
    onboarding.context?.checksPaused === true,
    onboardedOnEntry === true,
  );
  const device = onboarding.liveDevice;
  const closeLabel = t("deviceOnboarding.checks.close");
  const quitConfirmation = unseeded
    ? {
        isOpen: quitConfirmationOpen,
        stepName: lastSavedStepName(onboarding.state, onboarding.context?.currentSetupStep, t),
        onContinue: continueSetup,
        onLeave: leaveWithoutSaving,
      }
    : null;
  const leaveFromHeader = unseeded ? requestQuit : quitMachine;

  const screen = {
    state: onboarding.state,
    error: onboarding.error,
    device,
    screenState,
    phase,
    unseeded,
    quitConfirmation,
    copy: {
      failedTitle: t("deviceOnboarding.connection.failed"),
      connectingTitle: t("deviceOnboarding.connection.connecting"),
      retryLabel: t("common.retry"),
      closeLabel,
    },
    retry,
    reconnect,
    leaveFirmwareReconnect,
    quitOrLeave,
    leaveFromHeader,
    requestQuit,
    closeFirmwareHandover,
    send,
    firmwareVersion: readString(onboarding.context?.firmwareVersion),
    availableFirmwareVersion: readString(onboarding.context?.availableFirmwareVersion),
    firmwareUpToDate: onboarding.context?.firmwareUpToDate === true,
    genuineFailureKind: readString(onboarding.context?.genuineFailureKind),
  };
  if (unseededSetup) {
    return {
      status: "setup",
      setup: { ...unseededSetup.setup, leaveRequest: setupLeaveRequest },
      quitConfirmation: null,
    };
  }
  return earlyScreen(screen) ?? checksScreen(screen);
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
