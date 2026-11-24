import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addPostOnboardingAction } from "@ledgerhq/live-common/postOnboarding/actions";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import {
  useIsFocused,
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
  type RouteProp,
} from "@react-navigation/native";
import { getDeviceModel } from "@ledgerhq/devices";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import type { ReconnectSheetProps } from "@features/flow-device-onboarding-reconnect";
import {
  deviceReportsRecoveryKey,
  finishesSetupOnQuit,
  isFirmwareCheckFailed,
  isFirmwareUpdateDelegated,
  isHeldBackUpdatePending,
  SeedPath,
  updateWaitsForSeed,
  type DeviceOnboardingContext,
  type DeviceOnboardingExitReason,
} from "@features/platform-device-onboarding";
import { useFeature } from "@features/platform-feature-flags";
import { track } from "@shared/analytics";
import { useTranslation } from "~/context/Locale";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHasBeenUpsoldProtect } from "~/actions/settings";
import { NavigatorName, ScreenName } from "~/const";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { knownDevicesSelector } from "~/reducers/knownDevices";
import type { DeviceOnboardingNavigatorParamList } from "LLM/features/DeviceOnboarding/navigation/types";
import type {
  ChecksScreenProps,
  DeviceUnlockSheetProps,
} from "LLM/features/DeviceOnboarding/types";
import { lastSavedStepName } from "LLM/features/DeviceOnboarding/components/QuitConfirmation/lastSavedStep";
import {
  useDeviceOnboardingHost,
  useDeviceOnboardingSession,
} from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import type { DeviceOnboardingSession } from "LLM/features/DeviceOnboarding/hooks/useDeviceOnboarding";
import { useAfterDelay } from "LLM/features/DeviceOnboarding/hooks/useAfterDelay";
import { useFirmwareUpdateHandover } from "LLM/features/DeviceOnboarding/hooks/useFirmwareUpdateHandover";
import { useOfferSync } from "LLM/features/DeviceOnboarding/hooks/useOfferSync";
import { useReconnectWhileDeviceOff } from "LLM/features/DeviceOnboarding/hooks/useReconnectWhileDeviceOff";
import type { SetupScreenProps } from "LLM/features/DeviceOnboarding/screens/Setup/types";
import { seededButtons } from "@features/platform-device-onboarding-analytics";
import {
  useSeededFunnelTracking,
  type SeededFunnelTracking,
} from "LLM/features/DeviceOnboarding/analytics/useSeededFunnelTracking";
import type { UnseededIntroKaraokeScreenProps } from "LLM/features/DeviceOnboarding/screens/UnseededIntroKaraoke";
import type { UnseededSuccessKaraokeScreenProps } from "LLM/features/DeviceOnboarding/screens/UnseededSuccessKaraoke";
import type { RecoverNewSeedScreenProps } from "LLM/features/DeviceOnboarding/screens/Recover/NewSeed";
import type { RecoverRestoreScreenProps } from "LLM/features/DeviceOnboarding/screens/Recover/Restore";
import type { SuccessKaraokeScreenProps } from "LLM/features/DeviceOnboarding/screens/SuccessKaraoke";
import { completeSeededOnboarding } from "LLM/features/DeviceOnboarding/hooks/useCompleteSeededOnboarding";
import { resetToPortfolio } from "LLM/features/DeviceOnboarding/utils/exitActions";
import { toChecksError, toFirmwareUpdate } from "LLM/features/DeviceOnboarding/utils/checksPhase";
import {
  canRetryWithoutUser,
  giveUpAfterPowerOnMs,
  isDeviceOffDuringChecks,
  powerOnAfterUpdateDelayMs,
} from "LLM/features/DeviceOnboarding/utils/deviceOff";
import { checksScreenForPhase, phaseOf } from "LLM/features/DeviceOnboarding/utils/funnelPhase";
import {
  deviceLockedState,
  toDeviceUnlockSheetProps,
} from "LLM/features/DeviceOnboarding/utils/deviceLocked";
import { selectPairedKnownDevices } from "LLM/features/DeviceOnboarding/utils/pairedDevice";
import { useUnseededFunnelViewModel, type UnseededFunnelModel } from "./useUnseededFunnelViewModel";

/** Dedicated so Braze can tell a deferred Recover from a plain skip. The tracking-plan name is still open. */
const recoverDeferredEvent = "recover_deferred_from_new_seed";
const defaultProtectId = "protect-prod";

type FunnelRoute = RouteProp<DeviceOnboardingNavigatorParamList, ScreenName.DeviceOnboardingFunnel>;

const awaitingSessionAfterFirmwareUpdateState = "awaitingSessionAfterFirmwareUpdate";

export type QuitConfirmationModel = {
  isOpen: boolean;
  stepName: string;
  onContinue: () => void;
  onLeave: () => void;
};

export type PowerOnSheetModel = DeviceUnlockSheetProps & Readonly<{ onQuit: () => void }>;

export type DeviceOnboardingFunnelModel = (
  | {
      status: "unseededIntroKaraoke";
      unseededIntroKaraoke: UnseededIntroKaraokeScreenProps;
      unlockSheet: DeviceUnlockSheetProps | null;
    }
  | { status: "unseededSuccessKaraoke"; unseededSuccessKaraoke: UnseededSuccessKaraokeScreenProps }
  | {
      status: "checks";
      checks: ChecksScreenProps;
      unlockSheet: DeviceUnlockSheetProps | null;
      powerOnSheet: PowerOnSheetModel | null;
      reconnectSheet: ReconnectSheetProps | null;
    }
  | {
      status: "setup";
      setup: SetupScreenProps;
      unlockSheet: DeviceUnlockSheetProps | null;
      powerOnSheet: PowerOnSheetModel | null;
      reconnectSheet: ReconnectSheetProps | null;
    }
  | {
      status: "recoverRestore";
      recoverRestore: RecoverRestoreScreenProps;
      unlockSheet: DeviceUnlockSheetProps | null;
    }
  | {
      status: "recoverNewSeed";
      recoverNewSeed: RecoverNewSeedScreenProps;
      unlockSheet: DeviceUnlockSheetProps | null;
    }
  | {
      status: "success";
      success: SuccessKaraokeScreenProps;
      unlockSheet: DeviceUnlockSheetProps | null;
    }
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
  seedPath: SeedPath | null;
  confirmsQuit: boolean;
  quitConfirmationOpen: boolean;
  leaveFirmwareReconnect: () => void;
  closeFirmwareHandover: () => void;
  requestQuit: () => void;
  continueSetup: () => void;
  quitMachine: () => void;
  leave: () => void;
  leaveFinishedSetup: () => void;
  dismissRestore: () => boolean;
};

function showsUnseededSuccess({
  unseeded,
  state,
  seedPath,
}: Pick<LeaveActions, "unseeded" | "state" | "seedPath">) {
  return unseeded && state === "done" && seedPath !== SeedPath.NewSeed;
}

function isRunning({ status, state }: LeaveActions) {
  return status === "running" || state === "awaitingSession";
}

function blockBack(event: BackEvent, actions: LeaveActions) {
  if (actions.allowLeave) return;
  const action = event.data.action.type;
  if (action !== "GO_BACK" && action !== "POP") return;
  event.preventDefault();
  if (actions.dismissRestore()) return;
  if (showsUnseededSuccess(actions)) {
    actions.leaveFinishedSetup();
    return;
  }
  if (actions.state === awaitingSessionAfterFirmwareUpdateState) {
    actions.leaveFirmwareReconnect();
    return;
  }
  if (isRunning(actions) && actions.state) {
    if (actions.confirmsQuit && actions.quitConfirmationOpen) actions.continueSetup();
    else if (isFirmwareUpdateDelegated(actions.state)) actions.closeFirmwareHandover();
    else if (actions.confirmsQuit) actions.requestQuit();
    else actions.quitMachine();
    return;
  }
  actions.leave();
}

function quitOrLeaveSession(actions: LeaveActions) {
  if (isRunning(actions) && actions.state) {
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
  liveState: string | null;
  error: string | null;
  device: ChecksScreenProps["device"] | null;
  screenState: ChecksScreenProps["state"] | null;
  phase: ReturnType<typeof phaseOf>;
  unseeded: boolean;
  seedPath: SeedPath | null;
  wasReadOnlyAtEntry: boolean;
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
    type: "RETRY" | "SKIP" | "CONTINUE" | "CLOSE" | "USER_ACCEPT" | "USER_DECLINE";
  }) => boolean;
  firmwareVersion: string | null;
  availableFirmwareVersion: string | null;
  firmwareUpToDate: boolean;
  genuineFailureKind: string | null;
  tracking: ChecksTracking;
  markUpdateAccepted: () => void;
  /** Wraps a close button's action so it also sends the `close` click. */
  withCloseClick: (quit: () => void) => () => void;
  updateAfterSetup: boolean;
};

type ChecksTracking = Pick<SeededFunnelTracking, "seededDeviceType" | "trackClick" | "screensFor">;

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

function successScreen(actions: ScreenActions): DeviceOnboardingFunnelModel | null {
  if (!showsUnseededSuccess(actions)) {
    return null;
  }
  return {
    status: "unseededSuccessKaraoke",
    unseededSuccessKaraoke: { wasReadOnlyAtEntry: actions.wasReadOnlyAtEntry },
    quitConfirmation: null,
  };
}

function earlyScreen(actions: ScreenActions): DeviceOnboardingFunnelModel | null {
  const { copy, quitConfirmation } = actions;
  if (
    actions.state === awaitingSessionAfterFirmwareUpdateState &&
    actions.phase !== "resumingChecks"
  ) {
    if (actions.error) {
      return failedScreen(
        copy,
        actions.reconnect,
        actions.withCloseClick(actions.leaveFirmwareReconnect),
        quitConfirmation,
      );
    }
    return connectingScreen(
      copy,
      actions.withCloseClick(actions.leaveFirmwareReconnect),
      quitConfirmation,
    );
  }
  if (actions.state === "awaitingSession") {
    return failedScreen(
      copy,
      actions.reconnect,
      actions.withCloseClick(actions.leaveFromHeader),
      quitConfirmation,
    );
  }
  if (!actions.device || !actions.screenState) {
    const quit = actions.withCloseClick(actions.quitOrLeave);
    if (actions.error) return failedScreen(copy, actions.retry, quit, quitConfirmation);
    return connectingScreen(copy, quit, quitConfirmation);
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
    machineState === deviceLockedState ||
    (machineState === "readingState" && held?.afterLock === true)
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

function checksQuit(actions: ScreenActions): () => void {
  if (actions.liveState === awaitingSessionAfterFirmwareUpdateState) {
    return actions.leaveFirmwareReconnect;
  }
  if (isFirmwareUpdateDelegated(actions.state)) return actions.closeFirmwareHandover;
  return actions.leaveFromHeader;
}

/**
 * Leaving the wait for the updated device stops the reconnect, as on the checks screen. Otherwise,
 * mid-setup, leaving asks first; once only the held-back update is left, the update handover has its
 * own way out.
 */
function setupQuit(
  actions: Readonly<{
    confirmsQuit: boolean;
    liveState: string | null;
    state: string | null;
    requestQuit: () => void;
    leaveFirmwareReconnect: () => void;
    closeFirmwareHandover: () => void;
    quitMachine: () => void;
  }>,
): () => void {
  // The update reboots the device and drops its genuine verdict: the wait still has its own way out.
  if (actions.liveState === awaitingSessionAfterFirmwareUpdateState) {
    return actions.leaveFirmwareReconnect;
  }
  if (actions.confirmsQuit) return actions.requestQuit;
  if (isFirmwareUpdateDelegated(actions.state)) return actions.closeFirmwareHandover;
  return actions.quitMachine;
}

function genuineCheckCompleted(context: DeviceOnboardingSession["context"]): boolean {
  return context?.verdictMatchesSession === true;
}

/** When leaving asks first, and whether the held-back update still waits for an answer. */
function leaveRules(
  flat: DeviceOnboardingSession["context"],
  machine: NonNullable<DeviceOnboardingSession["snapshot"]>["context"] | undefined,
) {
  const onboardedOnEntry = flat?.onboardedOnEntry ?? null;
  // Leaving after setup ends it instead of losing it, as the machine does on QUIT.
  const setupDone = machine !== undefined && finishesSetupOnQuit(machine);
  const unseededMidSetup = onboardedOnEntry === false && !setupDone;
  const seededBeforeGenuineCheck = onboardedOnEntry === true && !genuineCheckCompleted(flat);
  return {
    confirmsQuit: unseededMidSetup || seededBeforeGenuineCheck,
    heldBackUpdatePending: machine !== undefined && isHeldBackUpdatePending(machine),
  };
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
  const unlockSheet = locked ? toDeviceUnlockSheetProps(device) : null;
  if (built.status === "checks") return { ...built, unlockSheet };
  if (built.status === "setup") return { ...built, unlockSheet };
  if (built.status === "recoverRestore") return { ...built, unlockSheet };
  if (built.status === "unseededIntroKaraoke") {
    return {
      ...built,
      unseededIntroKaraoke: { ...built.unseededIntroKaraoke, onFinish: () => false },
      unlockSheet,
    };
  }
  return built;
}

function productNameOf(modelId: ChecksScreenProps["device"]["modelId"]) {
  return getDeviceModel(modelId).productName || modelId;
}

type DeviceOffOverlay = Readonly<{
  active: boolean;
  device: ScreenActions["device"];
  quitConfirmationOpen: boolean;
  onQuit: () => void;
  onRetry: (() => void) | null;
}>;

function checksWhileDeviceOff(
  built: DeviceOnboardingFunnelModel,
  { active, device, quitConfirmationOpen, onQuit, onRetry }: DeviceOffOverlay,
): DeviceOnboardingFunnelModel {
  // The OS check held back until setup shows on Setup: it recovers like the checks screen.
  if (!active || (built.status !== "checks" && built.status !== "setup")) return built;
  if (onRetry) {
    return {
      ...built,
      reconnectSheet: device
        ? {
            connection: { state: "failed", retry: onRetry },
            productName: productNameOf(device.modelId),
            suspendSheets: quitConfirmationOpen,
            onQuit,
          }
        : null,
    };
  }
  return {
    ...built,
    powerOnSheet:
      device && !quitConfirmationOpen ? { ...toDeviceUnlockSheetProps(device), onQuit } : null,
  };
}

function checksScreen(actions: ScreenActions): DeviceOnboardingFunnelModel {
  const device = actions.device;
  const screenState = actions.screenState;
  if (!device || !screenState) {
    return connectingScreen(
      actions.copy,
      actions.withCloseClick(actions.quitOrLeave),
      actions.quitConfirmation,
    );
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
  const { tracking } = actions;
  return {
    status: "checks",
    quitConfirmation: actions.quitConfirmation,
    unlockSheet: null,
    powerOnSheet: null,
    reconnectSheet: null,
    checks: {
      device,
      suspendSheets: actions.suspendSheets,
      updateAfterSetup: actions.updateAfterSetup,
      state: screenState,
      error: toChecksError(actions.state, actions.genuineFailureKind),
      update:
        actions.phase === "checks"
          ? toFirmwareUpdate(actions.firmwareVersion, actions.availableFirmwareVersion)
          : null,
      firmwareUpToDate: actions.firmwareUpToDate,
      onStart: () => {
        tracking.trackClick(seededButtons.initiateGenuineCheck);
        actions.send({ type: startEvent });
      },
      onRetry: () => actions.send({ type: "RETRY" }),
      onSkipFirmwareCheck:
        actions.updateAfterSetup && isFirmwareCheckFailed(actions.state)
          ? () => actions.send({ type: "SKIP" })
          : undefined,
      onCloseSheet: () => actions.send({ type: "CLOSE" }),
      onAcceptUpdate: () => actions.send({ type: "USER_ACCEPT" }),
      onDeclineUpdate: () => {
        tracking.trackClick(seededButtons.skipUpdate);
        actions.send({ type: "USER_DECLINE" });
      },
      onUpdatePressed: () => {
        tracking.trackClick(seededButtons.continue);
        actions.markUpdateAccepted();
      },
      onInstallUpdate: () => tracking.trackClick(seededButtons.installUpdate),
      onUpdateSheetClosed: () => tracking.trackClick(seededButtons.close),
      screensFor: tracking.screensFor,
      seededDeviceType: tracking.seededDeviceType,
      onContinue:
        actions.state === "checks.checksSucceeded"
          ? () => {
              tracking.trackClick(seededButtons.continue);
              actions.send({ type: "CONTINUE" });
            }
          : undefined,
      onQuit: checksQuit(actions),
      onClosePressed: () => tracking.trackClick(seededButtons.close),
    },
  };
}

function useRestoreRecoverHandoff({
  focused,
  liveDevice,
  navigation,
  pollingPaused,
  protectId,
  restoreShown,
  send,
  state,
}: Readonly<{
  focused: boolean;
  liveDevice: Device | null;
  navigation: NavigationProp<ParamListBase>;
  pollingPaused: boolean;
  protectId: string;
  /** False once the user closed the restore screen, even if the machine is still on that step. */
  restoreShown: () => boolean;
  send: DeviceOnboardingSession["send"];
  state: DeviceOnboardingSession["state"];
}>): () => void {
  const openingRecover = useRef(false);
  const awaitingPollingResume = useRef(false);
  const continueRestore = useCallback(() => {
    openingRecover.current = true;
    send({ type: "PAUSE_POLLING" });
  }, [send]);

  useEffect(() => {
    if (!openingRecover.current || !pollingPaused) return;
    openingRecover.current = false;
    if (state !== "deviceSetup.restoreRecover" || !restoreShown()) {
      send({ type: "RESUME_POLLING" });
      return;
    }
    awaitingPollingResume.current = true;
    navigation.navigate(NavigatorName.Base, {
      screen: ScreenName.DeviceOnboardingRecover,
      params: {
        platform: protectId,
        device: liveDevice ?? undefined,
        redirectTo: "restore",
      },
    });
  }, [liveDevice, navigation, pollingPaused, protectId, restoreShown, send, state]);

  useEffect(() => {
    if (!focused || !awaitingPollingResume.current) return;
    awaitingPollingResume.current = false;
    send({ type: "RESUME_POLLING" });
  }, [focused, send]);

  return continueRestore;
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
  const [firmwareUpdateStarted, setFirmwareUpdateStarted] = useState(false);
  const onboarding = useDeviceOnboardingSession();
  const started = useRef(false);
  const dismissRestoreRef = useRef<(() => void) | null>(null);
  const [heldState, setHeldState] = useState<HeldState | null>(null);
  const dismissRestore = useCallback(() => {
    const dismiss = dismissRestoreRef.current;
    if (!dismiss) return false;
    dismiss();
    return true;
  }, []);
  const restoreShown = useCallback(() => dismissRestoreRef.current !== null, []);
  const onboardedOnEntry = onboarding.context?.onboardedOnEntry ?? null;
  const { confirmsQuit, heldBackUpdatePending } = leaveRules(
    onboarding.context,
    onboarding.snapshot?.context,
  );
  const machineState = onboarding.state;
  const locked = machineState === deviceLockedState;
  const holdingLockedScreen = isHoldingLockedScreen(machineState, heldState);
  const returningFromFirmwareUpdate = onboarding.context?.returningFromFirmwareUpdate === true;
  const deviceOffDuringChecks = isDeviceOffDuringChecks({
    machineState,
    heldMachineState: heldState?.state ?? null,
    onboardedOnEntry,
    hasLiveDevice: onboarding.liveDevice !== null,
    returningFromFirmwareUpdate,
    heldBackUpdatePending,
  });
  const holdingPreviousScreen = holdingLockedScreen || deviceOffDuringChecks;
  const shownState = holdingPreviousScreen ? (heldState?.state ?? machineState) : machineState;
  const seededTracking = useSeededFunnelTracking({
    machineState: shownState,
    machineContext: onboarding.snapshot?.context ?? null,
    firmwareUpdateStarted,
  });
  const { trackClick, trackAbort, trackExit } = seededTracking;
  const onLeave = useCallback(
    (reason: DeviceOnboardingExitReason, context: DeviceOnboardingContext) => {
      allowLeave.current = true;
      return trackExit(reason, context);
    },
    [trackExit],
  );
  const host = useMemo(
    () => ({ navigation, onLeave, dmk, knownDevices, offerSync, wasReadOnlyAtEntry }),
    [dmk, knownDevices, navigation, offerSync, onLeave, wasReadOnlyAtEntry],
  );
  useDeviceOnboardingHost(host);

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
    trackAbort();
    onboarding.reset();
    navigation.goBack();
  }, [navigation, onboarding, trackAbort]);

  const leaveFinishedSetup = useCallback(() => {
    allowLeave.current = true;
    resetToPortfolio(navigation);
  }, [navigation]);

  const leaveFirmwareReconnect = useCallback(() => {
    allowLeave.current = true;
    onboarding.abortFirmwareReconnect();
  }, [onboarding]);

  const quitMachine = useCallback(() => {
    send({ type: "QUIT" });
  }, [send]);

  const { close: closeFirmwareHandover, returnsWithoutUpdate } = useFirmwareUpdateHandover({
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
    // The machine is already final here: QUIT has nowhere to go, and completed did not navigate.
    if (onboarding.state === "done") {
      allowLeave.current = true;
      resetToPortfolio(navigation);
      return;
    }
    if (isFirmwareUpdateDelegated(onboarding.state)) closeFirmwareHandover();
    send({ type: "QUIT" });
  }, [closeFirmwareHandover, navigation, onboarding.state, send]);

  const unseeded = onboardedOnEntry === false;
  const seedPath = onboarding.snapshot?.context.seedPath ?? null;
  const updateAfterSetup = onboarding.snapshot?.context.updateAfterSetup === true;
  if (!confirmsQuit && quitConfirmationOpen) setQuitConfirmationOpen(false);

  const quitOrLeave = useCallback(() => {
    quitOrLeaveSession({
      allowLeave: allowLeave.current,
      state: onboarding.state,
      status: onboarding.status,
      unseeded,
      seedPath,
      confirmsQuit,
      quitConfirmationOpen,
      leaveFirmwareReconnect,
      closeFirmwareHandover,
      requestQuit,
      continueSetup,
      quitMachine,
      leave,
      leaveFinishedSetup,
      dismissRestore,
    });
  }, [
    closeFirmwareHandover,
    continueSetup,
    dismissRestore,
    leave,
    leaveFinishedSetup,
    leaveFirmwareReconnect,
    onboarding.state,
    onboarding.status,
    quitConfirmationOpen,
    quitMachine,
    requestQuit,
    confirmsQuit,
    seedPath,
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
          seedPath,
          confirmsQuit,
          quitConfirmationOpen,
          leaveFirmwareReconnect,
          closeFirmwareHandover,
          requestQuit,
          continueSetup,
          quitMachine,
          leave,
          leaveFinishedSetup,
          dismissRestore,
        });
      }),
    [
      closeFirmwareHandover,
      continueSetup,
      dismissRestore,
      leave,
      leaveFinishedSetup,
      leaveFirmwareReconnect,
      navigation,
      onboarding.state,
      onboarding.status,
      quitConfirmationOpen,
      quitMachine,
      requestQuit,
      confirmsQuit,
      seedPath,
      unseeded,
    ],
  );

  const { connect } = onboarding;
  const liveDeviceId = onboarding.liveDevice?.deviceId;
  const reconnectToLiveDevice = useCallback(() => connect(liveDeviceId), [connect, liveDeviceId]);
  useReconnectWhileDeviceOff({
    deviceOff: deviceOffDuringChecks,
    error: onboarding.error,
    connect: reconnectToLiveDevice,
  });
  const phase = phaseOf(
    shownState,
    onboardedOnEntry,
    returningFromFirmwareUpdate,
    heldBackUpdatePending,
  );
  const waitingForUpdatedDevice =
    phase === "resumingChecks" && machineState === awaitingSessionAfterFirmwareUpdateState;
  const waitedLongForDeviceAfterUpdate = useAfterDelay(
    waitingForUpdatedDevice,
    powerOnAfterUpdateDelayMs,
  );
  const [waitAttempt, setWaitAttempt] = useState(0);
  const askingToPowerOn = waitedLongForDeviceAfterUpdate || deviceOffDuringChecks;
  const gaveUpWaiting = useAfterDelay(askingToPowerOn, giveUpAfterPowerOnMs, waitAttempt);
  const reconnectFailed =
    gaveUpWaiting ||
    (onboarding.error !== null &&
      (waitingForUpdatedDevice ||
        (deviceOffDuringChecks && !canRetryWithoutUser(onboarding.error))));
  const retryAfterFailure = useCallback(() => {
    setWaitAttempt(previous => previous + 1);
    if (waitingForUpdatedDevice) reconnect();
    else reconnectToLiveDevice();
  }, [reconnect, reconnectToLiveDevice, waitingForUpdatedDevice]);
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
  const suspendSheets =
    holdingLockedScreen ||
    deviceOffDuringChecks ||
    waitedLongForDeviceAfterUpdate ||
    reconnectFailed ||
    quitConfirmation?.isOpen === true;
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const recoverFeature = useFeature("protectServicesMobile");
  const recoverAvailable = recoverFeature?.enabled === true;
  const protectId = recoverFeature?.params?.protectId ?? defaultProtectId;
  const focused = useIsFocused();
  const [pastRecover, setPastRecover] = useState(false);
  const awaitingRecoverReturn = useRef(false);

  useEffect(() => {
    if (!focused || !awaitingRecoverReturn.current) return;
    awaitingRecoverReturn.current = false;
    setPastRecover(true);
  }, [focused]);

  const finishUnseeded = useCallback(
    (sawRecoverPitch: boolean) => {
      completeSeededOnboarding(dispatch, wasReadOnlyAtEntry, hasCompletedOnboarding);
      if (sawRecoverPitch) dispatch(setHasBeenUpsoldProtect(true));
      allowLeave.current = true;
      resetToPortfolio(navigation);
    },
    [dispatch, hasCompletedOnboarding, navigation, wasReadOnlyAtEntry],
  );

  const syncOfferDecided = useRef(false);
  const liveDevice = onboarding.liveDevice;
  const recoverPitchBlocksKaraoke =
    recoverAvailable && seedPath === SeedPath.NewSeed && !pastRecover;
  const readyForKaraoke = unseeded && machineState === "done" && !recoverPitchBlocksKaraoke;
  useEffect(() => {
    if (!focused || !readyForKaraoke || syncOfferDecided.current) return;
    syncOfferDecided.current = true;
    if (!offerSync || !liveDevice) return;
    navigation.navigate(ScreenName.DeviceOnboardingSyncOffer, {
      device: liveDevice,
      wasReadOnlyAtEntry,
      unseeded: true,
      seededResult: null,
    });
  }, [focused, liveDevice, navigation, offerSync, readyForKaraoke, wasReadOnlyAtEntry]);

  const continueRestore = useRestoreRecoverHandoff({
    focused,
    liveDevice: onboarding.liveDevice,
    navigation,
    pollingPaused: onboarding.context?.pollingPaused === true,
    protectId,
    restoreShown,
    send,
    state: onboarding.state,
  });

  const openRecover = useCallback(() => {
    if (!recoverAvailable) return;
    awaitingRecoverReturn.current = true;
    navigation.navigate(NavigatorName.Base, {
      screen: ScreenName.DeviceOnboardingRecover,
      params: {
        platform: protectId,
        device: onboarding.liveDevice ?? undefined,
      },
    });
  }, [navigation, onboarding.liveDevice, protectId, recoverAvailable]);

  const remindRecoverLater = useCallback(() => {
    dispatch(addPostOnboardingAction({ actionId: PostOnboardingActionId.recover }));
    track(recoverDeferredEvent, { page: "Recover new seed" });
    setPastRecover(true);
  }, [dispatch]);

  const unseededSetup = useUnseededFunnelViewModel({
    machineState: shownState,
    liveMachineState: machineState,
    onboardedOnEntry,
    updateAfterSetup: holdsUpdateUntilSetup(onboarding.snapshot?.context),
    seeded: onboarding.snapshot?.context.isOnboarded === true,
    funnelRecoversDrop: deviceOffDuringChecks,
    currentStep: onboarding.context?.currentOnboardingStep ?? null,
    seedPath,
    pastRecover,
    recoverAvailable,
    checksPaused: onboarding.context?.checksPaused === true,
    genuineFailureKind: readString(onboarding.context?.genuineFailureKind),
    deviceNotGenuine:
      genuineCheckCompleted(onboarding.context) &&
      onboarding.context?.genuineFailureKind === "DEVICE_NOT_GENUINE",
    firmwareVersion: readString(onboarding.context?.firmwareVersion),
    availableFirmwareVersion: readString(onboarding.context?.availableFirmwareVersion),
    firmwareDeclined: onboarding.snapshot?.context.firmware?.kind === "declined",
    returnsWithoutUpdate,
    reportsRecoveryKey: deviceReportsRecoveryKey(
      onboarding.context?.deviceModelId,
      readString(onboarding.context?.firmwareVersion) ?? "",
    ),
    device: onboarding.liveDevice,
    connectionError: onboarding.error,
    suspendSheets,
    reconnect: reconnectToLiveDevice,
    send,
    onQuit: setupQuit({
      confirmsQuit,
      liveState: machineState,
      state: onboarding.state,
      requestQuit,
      leaveFirmwareReconnect,
      closeFirmwareHandover,
      quitMachine,
    }),
  });
  dismissRestoreRef.current = restoreDismiss(unseededSetup);

  const screen = {
    state: shownState,
    liveState: machineState,
    error: onboarding.error,
    device,
    screenState,
    phase,
    unseeded,
    seedPath,
    wasReadOnlyAtEntry,
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
    tracking: {
      seededDeviceType: seededTracking.seededDeviceType,
      trackClick,
      screensFor: seededTracking.screensFor,
    },
    markUpdateAccepted: () => setFirmwareUpdateStarted(true),
    withCloseClick: (quit: () => void) => () => {
      trackClick(seededButtons.close);
      quit();
    },
    updateAfterSetup,
  };
  const built =
    successScreen(screen) ??
    screenForUnseeded(unseededSetup, {
      quitConfirmation,
      suspendSheets,
      deviceType: device?.modelId ?? null,
      deviceVersion: readString(onboarding.context?.firmwareVersion),
      onSkip: () => setPastRecover(true),
      onRemindLater: remindRecoverLater,
      onOpenLiveApp: openRecover,
      onContinueRestore: continueRestore,
      onClose: requestQuit,
      onFinish: finishUnseeded,
    }) ??
    earlyScreen(screen) ??
    checksScreen(screen);
  const nextHeld = nextHeldState(
    heldState,
    machineState,
    holdingPreviousScreen,
    built.status === "checks" ||
      built.status === "setup" ||
      built.status === "unseededIntroKaraoke" ||
      built.status === "recoverRestore" ||
      built.status === "recoverNewSeed" ||
      built.status === "success",
  );
  if (nextHeld !== heldState) setHeldState(nextHeld);

  return checksWhileDeviceOff(withUnlockSheet(built, holdingLockedScreen, locked, device), {
    active: deviceOffDuringChecks || waitedLongForDeviceAfterUpdate || reconnectFailed,
    device,
    quitConfirmationOpen: quitConfirmation?.isOpen === true,
    onQuit: screen.withCloseClick(
      waitingForUpdatedDevice ? leaveFirmwareReconnect : leaveFromHeader,
    ),
    onRetry: reconnectFailed ? retryAfterFailure : null,
  });
}

function restoreDismiss(flow: UnseededFunnelModel | null): (() => void) | null {
  if (flow?.status !== "recoverRestore") return null;
  return flow.dismiss;
}

function screenForUnseeded(
  flow: UnseededFunnelModel | null,
  actions: Readonly<{
    quitConfirmation: QuitConfirmationModel | null;
    suspendSheets: boolean;
    deviceType: string | null;
    deviceVersion: string | null;
    onSkip: () => void;
    onRemindLater: () => void;
    onOpenLiveApp: () => void;
    onContinueRestore: () => void;
    onClose: () => void;
    onFinish: (sawRecoverPitch: boolean) => void;
  }>,
): DeviceOnboardingFunnelModel | null {
  if (flow?.status === "recoverRestore") {
    return {
      status: "recoverRestore",
      quitConfirmation: actions.quitConfirmation,
      unlockSheet: null,
      recoverRestore: {
        deviceType: actions.deviceType,
        deviceVersion: actions.deviceVersion,
        onClose: flow.dismiss,
        onContinue: actions.onContinueRestore,
      },
    };
  }
  if (flow?.status === "setup") {
    return {
      status: "setup",
      setup: flow.setup,
      quitConfirmation: actions.quitConfirmation,
      unlockSheet: null,
      powerOnSheet: null,
      reconnectSheet: null,
    };
  }
  if (flow?.status === "recoverNewSeed") {
    return {
      status: "recoverNewSeed",
      quitConfirmation: actions.quitConfirmation,
      unlockSheet: null,
      recoverNewSeed: {
        suspendSheets: actions.suspendSheets,
        onSkip: actions.onSkip,
        onRemindLater: actions.onRemindLater,
        onOpenLiveApp: actions.onOpenLiveApp,
        onClose: actions.onClose,
      },
    };
  }
  if (flow?.status === "success") {
    const sawRecoverPitch = flow.sawRecoverPitch;
    return {
      status: "success",
      quitConfirmation: actions.quitConfirmation,
      unlockSheet: null,
      success: { onFinish: () => actions.onFinish(sawRecoverPitch) },
    };
  }
  return null;
}

/** An unseeded Nano whose OS can only update once it is seeded. */
function holdsUpdateUntilSetup(
  context: NonNullable<DeviceOnboardingSession["snapshot"]>["context"] | undefined,
): boolean {
  if (!context) return false;
  if (context.updateAfterSetup) return true;
  if (context.firmwareVersion === null || context.onboardedOnEntry !== false) return false;
  return updateWaitsForSeed({
    currentVersion: context.firmwareVersion,
    deviceModelId: context.deviceModelId,
    isOnboarded: false,
  });
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
