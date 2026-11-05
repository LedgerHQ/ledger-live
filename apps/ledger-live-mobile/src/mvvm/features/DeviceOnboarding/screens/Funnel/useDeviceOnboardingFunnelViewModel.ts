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
import type { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import {
  useDeviceOnboardingHost,
  useDeviceOnboardingSession,
} from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import type { DeviceOnboardingSession } from "LLM/features/DeviceOnboarding/hooks/useDeviceOnboarding";
import { useOfferSync } from "LLM/features/DeviceOnboarding/hooks/useOfferSync";
import type { ChecksScreenProps } from "LLM/features/DeviceOnboarding/types";
import { toChecksError, toFirmwareUpdate } from "LLM/features/DeviceOnboarding/utils/checksPhase";
import { checksScreenForPhase, phaseOf } from "LLM/features/DeviceOnboarding/utils/funnelPhase";
import { selectPairedKnownDevices } from "LLM/features/DeviceOnboarding/utils/pairedDevice";
import { useFirmwareUpdateHandover } from "LLM/features/DeviceOnboarding/hooks/useFirmwareUpdateHandover";
import { lastSavedStepName } from "../../components/QuitConfirmation/lastSavedStep";

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

export type UnlockSheetModel = Readonly<{
  deviceModelId: Device["modelId"];
  deviceName: string;
}>;

export type DeviceOnboardingFunnelModel = (
  | { status: "karaoke"; onClose: () => void }
  | { status: "checks"; checks: ChecksScreenProps; unlockSheet: UnlockSheetModel | null }
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
    unlockSheet: null,
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
  const [rememberedChecks, setRememberedChecks] = useState<RememberedChecks | null>(null);

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
    setQuitConfirmationOpen(true);
  }, []);

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
  const machineState = onboarding.state;
  const locked = machineState === "deviceLocked";
  const holdingLockedScreen =
    locked || (machineState === "readingState" && rememberedChecks?.holdThroughReading === true);
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
  const built = earlyScreen(screen) ?? checksScreen(screen);
  const freshChecks = built.status === "checks" ? built.checks : null;
  const nextRemembered = nextRememberedChecks(
    rememberedChecks,
    machineState,
    holdingLockedScreen,
    freshChecks,
  );
  if (nextRemembered !== rememberedChecks) setRememberedChecks(nextRemembered);

  const heldChecks = holdingLockedScreen ? (nextRemembered?.checks ?? freshChecks) : freshChecks;
  if (!holdingLockedScreen || !heldChecks) return built;

  return {
    status: "checks",
    checks: { ...heldChecks, suspendSheets: true },
    unlockSheet: locked
      ? {
          deviceModelId: heldChecks.device.modelId,
          deviceName: heldChecks.device.deviceName ?? "",
        }
      : null,
    quitConfirmation,
  };
}

type RememberedChecks = Readonly<{
  key: string;
  signature: string;
  checks: ChecksScreenProps;
  holdThroughReading: boolean;
}>;

function checksSignature(checks: ChecksScreenProps): string {
  return [
    checks.state,
    checks.update?.current ?? "",
    checks.update?.available ?? "",
    checks.error?.kind ?? "",
    checks.firmwareUpToDate,
    checks.onContinue ? "continue" : "",
    checks.onQuit ? "quit" : "",
  ].join("|");
}

function nextRememberedChecks(
  remembered: RememberedChecks | null,
  machineState: string | null,
  holdingLockedScreen: boolean,
  freshChecks: ChecksScreenProps | null,
): RememberedChecks | null {
  if (
    remembered &&
    freshChecks &&
    remembered.checks.device.deviceId !== freshChecks.device.deviceId
  ) {
    return {
      key: machineState ?? "",
      signature: checksSignature(freshChecks),
      checks: freshChecks,
      holdThroughReading: holdingLockedScreen,
    };
  }

  if (!holdingLockedScreen) {
    if (!freshChecks) return null;
    const key = machineState ?? "";
    const signature = checksSignature(freshChecks);
    if (
      remembered?.key === key &&
      remembered.signature === signature &&
      !remembered.holdThroughReading
    ) {
      return remembered;
    }
    return { key, signature, checks: freshChecks, holdThroughReading: false };
  }

  if (machineState !== "deviceLocked") return remembered;
  if (remembered?.holdThroughReading) return remembered;

  const checks = remembered?.checks ?? freshChecks;
  if (!checks) return remembered;
  return {
    key: remembered?.key ?? "deviceLocked",
    signature: remembered?.signature ?? checksSignature(checks),
    checks,
    holdThroughReading: true,
  };
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
