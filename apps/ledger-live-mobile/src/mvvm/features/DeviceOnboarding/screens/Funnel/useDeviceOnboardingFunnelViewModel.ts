import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
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
import type { DeviceOnboardingNavigatorParamList } from "LLM/features/DeviceOnboarding/navigation/types";
import { lastSavedStepName } from "LLM/features/DeviceOnboarding/components/QuitConfirmation/lastSavedStep";
import {
  useDeviceOnboardingHost,
  useDeviceOnboardingSession,
} from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import type { DeviceOnboardingSession } from "LLM/features/DeviceOnboarding/hooks/useDeviceOnboarding";
import { useFirmwareUpdateHandover } from "LLM/features/DeviceOnboarding/hooks/useFirmwareUpdateHandover";
import { useOfferSync } from "LLM/features/DeviceOnboarding/hooks/useOfferSync";
import type { SetupScreenProps } from "LLM/features/DeviceOnboarding/screens/Setup/types";
import type { ChecksScreenProps } from "LLM/features/DeviceOnboarding/types";
import type { UnseededIntroKaraokeScreenProps } from "LLM/features/DeviceOnboarding/screens/UnseededIntroKaraoke";
import { toChecksError, toFirmwareUpdate } from "LLM/features/DeviceOnboarding/utils/checksPhase";
import { checksScreenForPhase, phaseOf } from "LLM/features/DeviceOnboarding/utils/funnelPhase";
import { selectPairedKnownDevices } from "LLM/features/DeviceOnboarding/utils/pairedDevice";
import { useUnseededFunnelViewModel } from "./useUnseededFunnelViewModel";

type FunnelRoute = RouteProp<DeviceOnboardingNavigatorParamList, ScreenName.DeviceOnboardingFunnel>;

const firmwareUpdateDelegatedState = "checks.firmwareUpdateDelegated";
const awaitingSessionAfterFirmwareUpdateState = "awaitingSessionAfterFirmwareUpdate";

export type QuitConfirmationModel = {
  isOpen: boolean;
  stepName: string;
  onContinue: () => void;
  onLeave: () => void;
};

export type UnlockSheetModel = Readonly<{
  deviceModelId: Device["modelId"];
  deviceName: string;
}>;

export type DeviceOnboardingFunnelModel = (
  | {
      status: "unseededIntroKaraoke";
      unseededIntroKaraoke: UnseededIntroKaraokeScreenProps;
      unlockSheet: UnlockSheetModel | null;
    }
  | { status: "checks"; checks: ChecksScreenProps; unlockSheet: UnlockSheetModel | null }
  | { status: "setup"; setup: SetupScreenProps; unlockSheet: UnlockSheetModel | null }
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
  confirmsQuit: boolean;
  quitConfirmationOpen: boolean;
  leaveFirmwareReconnect: () => void;
  closeFirmwareHandover: () => void;
  requestQuit: () => void;
  continueSetup: () => void;
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
    if (actions.confirmsQuit && actions.quitConfirmationOpen) actions.continueSetup();
    else if (actions.state === firmwareUpdateDelegatedState) actions.closeFirmwareHandover();
    else if (actions.confirmsQuit) actions.requestQuit();
    else actions.quitMachine();
    return;
  }
  actions.leave();
}

function quitOrLeaveSession(actions: LeaveActions) {
  if (actions.status === "running" && actions.state) {
    if (actions.confirmsQuit) {
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
  confirmsQuit: boolean;
  suspendSheets: boolean;
  quitConfirmation: QuitConfirmationModel | null;
  copy: ScreenCopy;
  retry: () => void;
  reconnect: () => void;
  leaveFirmwareReconnect: () => void;
  quitOrLeave: () => void;
  leaveFromHeader: () => void;
  requestQuit: () => void;
  closeFirmwareHandover: () => void;
  send: (event: {
    type: "RETRY" | "CONTINUE" | "CLOSE" | "USER_ACCEPT" | "USER_DECLINE";
  }) => boolean;
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

function connectWhenIdle(
  started: { current: boolean },
  onboarding: {
    status: string;
    state: string | null;
    error: string | null;
    connect: () => void;
  },
) {
  if (started.current) return;
  started.current = true;
  if (onboarding.status !== "idle" || onboarding.state !== null || onboarding.error) return;
  onboarding.connect();
}

type HeldState = Readonly<{ state: string; afterLock: boolean }>;

function isHoldingLockedScreen(machineState: string | null, held: HeldState | null) {
  return (
    machineState === "deviceLocked" || (machineState === "readingState" && held?.afterLock === true)
  );
}

function nextHeldState(
  held: HeldState | null,
  machineState: string | null,
  holding: boolean,
  holdsScreen: boolean,
): HeldState | null {
  if (machineState === null) return null;
  if (holding) {
    return held?.afterLock ? held : { state: held?.state ?? machineState, afterLock: true };
  }
  if (!holdsScreen) return null;
  return held?.state === machineState && !held.afterLock
    ? held
    : { state: machineState, afterLock: false };
}

function genuineCheckCompleted(context: DeviceOnboardingSession["context"]): boolean {
  return context?.verdictMatchesSession === true;
}

function quitConfirmationWhileUnlocked(
  confirmsQuit: boolean,
  open: boolean,
  holdingLockedScreen: boolean,
  stepName: string,
  onContinue: () => void,
  onLeave: () => void,
): QuitConfirmationModel | null {
  if (!confirmsQuit) return null;
  return {
    isOpen: open && !holdingLockedScreen,
    stepName,
    onContinue: holdingLockedScreen ? () => undefined : onContinue,
    onLeave,
  };
}

function withUnlockSheet(
  built: DeviceOnboardingFunnelModel,
  holdingLockedScreen: boolean,
  locked: boolean,
  device: ScreenActions["device"],
): DeviceOnboardingFunnelModel {
  if (!holdingLockedScreen || !device) return built;
  const unlockSheet = locked
    ? { deviceModelId: device.modelId, deviceName: device.deviceName ?? "" }
    : null;
  if (built.status === "checks") return { ...built, unlockSheet };
  if (built.status === "setup") return { ...built, unlockSheet };
  if (built.status === "unseededIntroKaraoke") {
    return {
      ...built,
      unseededIntroKaraoke: { ...built.unseededIntroKaraoke, onFinish: () => false },
      unlockSheet,
    };
  }
  return built;
}

function checksScreen(actions: ScreenActions): DeviceOnboardingFunnelModel {
  const device = actions.device;
  const screenState = actions.screenState;
  if (!device || !screenState) {
    return connectingScreen(actions.copy, actions.quitOrLeave, actions.quitConfirmation);
  }
  if (actions.unseeded && actions.state === "awaitingStart") {
    return {
      status: "unseededIntroKaraoke",
      unseededIntroKaraoke: {
        deviceModelId: device.modelId,
        suspendSheets: actions.suspendSheets,
        onFinish: () => actions.send({ type: "CONTINUE" }),
        onClose: actions.requestQuit,
      },
      unlockSheet: null,
      quitConfirmation: actions.quitConfirmation,
    };
  }
  const startEvent = actions.state === "checks.checksIdle" ? "RETRY" : "CONTINUE";
  return {
    status: "checks",
    quitConfirmation: actions.quitConfirmation,
    unlockSheet: null,
    checks: {
      device,
      suspendSheets: actions.suspendSheets,
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
  const [heldState, setHeldState] = useState<HeldState | null>(null);

  useEffect(() => {
    connectWhenIdle(started, onboarding);
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
    setQuitConfirmationOpen(true);
  }, []);

  const continueSetup = useCallback(() => {
    setQuitConfirmationOpen(false);
  }, []);

  const leaveWithoutSaving = useCallback(() => {
    if (quitSent.current) return;
    quitSent.current = true;
    setQuitConfirmationOpen(false);
    if (onboarding.state === firmwareUpdateDelegatedState) closeFirmwareHandover();
    send({ type: "QUIT" });
  }, [closeFirmwareHandover, onboarding.state, send]);

  const onboardedOnEntry = onboarding.context?.onboardedOnEntry ?? null;
  const unseeded = onboardedOnEntry === false;
  const confirmsQuit =
    unseeded || (onboardedOnEntry === true && !genuineCheckCompleted(onboarding.context));
  if (!confirmsQuit && quitConfirmationOpen) setQuitConfirmationOpen(false);

  const quitOrLeave = useCallback(() => {
    quitOrLeaveSession({
      allowLeave: allowLeave.current,
      state: onboarding.state,
      status: onboarding.status,
      confirmsQuit,
      quitConfirmationOpen,
      leaveFirmwareReconnect,
      closeFirmwareHandover,
      requestQuit,
      continueSetup,
      quitMachine,
      leave,
    });
  }, [
    closeFirmwareHandover,
    continueSetup,
    leave,
    leaveFirmwareReconnect,
    onboarding.state,
    onboarding.status,
    quitConfirmationOpen,
    quitMachine,
    requestQuit,
    confirmsQuit,
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
          confirmsQuit,
          quitConfirmationOpen,
          leaveFirmwareReconnect,
          closeFirmwareHandover,
          requestQuit,
          continueSetup,
          quitMachine,
          leave,
        });
      }),
    [
      closeFirmwareHandover,
      continueSetup,
      leave,
      leaveFirmwareReconnect,
      navigation,
      onboarding.state,
      onboarding.status,
      quitConfirmationOpen,
      quitMachine,
      requestQuit,
      confirmsQuit,
    ],
  );

  const machineState = onboarding.state;
  const locked = machineState === "deviceLocked";
  const holdingLockedScreen = isHoldingLockedScreen(machineState, heldState);
  const shownState = holdingLockedScreen ? (heldState?.state ?? machineState) : machineState;
  const phase = phaseOf(shownState, onboardedOnEntry);
  const screenState = checksScreenForPhase(
    phase,
    shownState,
    onboarding.context?.checksPaused === true,
    onboardedOnEntry === true,
  );
  const device = onboarding.liveDevice;
  const closeLabel = t("deviceOnboarding.checks.close");
  const quitConfirmation = quitConfirmationWhileUnlocked(
    confirmsQuit,
    quitConfirmationOpen,
    holdingLockedScreen,
    onboardedOnEntry === true
      ? t("deviceOnboarding.quitConfirmation.steps.checks")
      : lastSavedStepName(onboarding.state, onboarding.context?.currentSetupStep, t),
    continueSetup,
    leaveWithoutSaving,
  );
  const leaveFromHeader = confirmsQuit ? requestQuit : quitMachine;
  const suspendSheets = holdingLockedScreen || quitConfirmation?.isOpen === true;
  const unseededSetup = useUnseededFunnelViewModel({
    machineState: shownState,
    liveMachineState: machineState,
    onboardedOnEntry,
    currentStep: onboarding.context?.currentOnboardingStep ?? null,
    checksPaused: onboarding.context?.checksPaused === true,
    genuineFailureKind: readString(onboarding.context?.genuineFailureKind),
    deviceNotGenuine:
      genuineCheckCompleted(onboarding.context) &&
      onboarding.context?.genuineFailureKind === "DEVICE_NOT_GENUINE",
    firmwareVersion: readString(onboarding.context?.firmwareVersion),
    availableFirmwareVersion: readString(onboarding.context?.availableFirmwareVersion),
    device: onboarding.liveDevice,
    suspendSheets,
    send,
    onQuit: requestQuit,
  });

  const screen = {
    state: shownState,
    error: onboarding.error,
    device,
    screenState,
    phase,
    unseeded,
    confirmsQuit,
    suspendSheets,
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
  const built = unseededSetup
    ? {
        status: "setup" as const,
        setup: unseededSetup.setup,
        quitConfirmation,
        unlockSheet: null,
      }
    : (earlyScreen(screen) ?? checksScreen(screen));
  const nextHeld = nextHeldState(
    heldState,
    machineState,
    holdingLockedScreen,
    built.status === "checks" ||
      built.status === "setup" ||
      built.status === "unseededIntroKaraoke",
  );
  if (nextHeld !== heldState) setHeldState(nextHeld);

  return withUnlockSheet(built, holdingLockedScreen, locked, device);
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
