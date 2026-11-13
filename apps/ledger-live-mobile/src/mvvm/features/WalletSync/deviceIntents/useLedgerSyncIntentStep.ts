import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BackHandler } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { DeviceConnectionResult, ExecutorState } from "@features/platform-device-intent";
import type {
  LedgerSyncFailureReason,
  LedgerSyncJobState,
} from "@features/platform-intent-wallet-sync";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { isModalLockedSelector } from "~/reducers/appstate";
import { useDestroyTrustchain } from "../hooks/useDestroyTrustchain";
import { type DrawerProps, SceneKind } from "../hooks/useFollowInstructionDrawer";

type Scene = DrawerProps["scene"];

export type LedgerSyncStepNavigation = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList>
>["navigation"];

type StepPhase<RunIntent> =
  | { type: "pending" }
  | { type: "running"; runId: number; intent: RunIntent }
  | { type: "failed"; scene: Scene };

export type LedgerSyncIntentStep<RunIntent> = Readonly<{
  phase: StepPhase<RunIntent>;
  /** Props of the existing error drawer, shown once a run failed. */
  errorDrawerProps: DrawerProps;
  /** Closes the step after a success, before the entry navigates with the result. */
  finish: () => void;
  /** Closes the error drawer, only on a dismissal: not on Retry nor on an unmount. */
  onErrorDrawerClose: () => void;
  onUserCancel: () => void;
  onExecutorStateChanged: (executorState: ExecutorState) => void;
  onIntentJobStateChanged: (jobState: LedgerSyncJobState) => void;
}>;

type Params<RunIntent, StartInput> = Readonly<{
  /** What the entry started the step with; Retry reuses it. */
  input: StartInput;
  /** Unmounts the step: the user stays on the entry screen. */
  onClose: () => void;
  /** Builds the intent of one run; a throw shows the generic error. */
  buildIntent: (input: StartInput) => RunIntent;
  /** False while a run cannot be built yet: the step waits, then starts. */
  isReady?: boolean;
  onDeviceRejected?: (connectionResult: DeviceConnectionResult | undefined) => void;
}>;

function sceneOfFailure(reason: LedgerSyncFailureReason, error: Error): Scene {
  switch (reason) {
    case "already-secured-same-seed":
      return { kind: SceneKind.AlreadySecuredSameSeed };
    case "already-secured-other-seed":
      return { kind: SceneKind.AlreadySecuredOtherSeed };
    case "no-trustchain":
      return { kind: SceneKind.UnbackedError };
    case "not-allowed":
      return { kind: SceneKind.KeyError };
    case "unknown":
      return { kind: SceneKind.GenericError, error };
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function buildPhase<RunIntent, StartInput>(
  buildIntent: (input: StartInput) => RunIntent,
  input: StartInput,
  runId: number,
): StepPhase<RunIntent> {
  try {
    return { type: "running", runId, intent: buildIntent(input) };
  } catch (error) {
    return { type: "failed", scene: { kind: SceneKind.GenericError, error: toError(error) } };
  }
}

/**
 * Drives one Ledger Sync device step on DIE over the screen the user started from: one
 * executor per run, then the existing error scenes when a run fails. Retry starts a new
 * run with a fresh intent. Closing only closes the step: the user stays on that screen.
 */
export function useLedgerSyncIntentStep<RunIntent, StartInput>({
  input,
  onClose,
  buildIntent,
  isReady = true,
  onDeviceRejected,
}: Params<RunIntent, StartInput>): LedgerSyncIntentStep<RunIntent> {
  const navigation = useNavigation<LedgerSyncStepNavigation>();
  const { deleteMutation } = useDestroyTrustchain();
  const isLocked = useSelector(isModalLockedSelector);
  const buildIntentRef = useRef(buildIntent);
  const onDeviceRejectedRef = useRef(onDeviceRejected);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    buildIntentRef.current = buildIntent;
    onDeviceRejectedRef.current = onDeviceRejected;
    onCloseRef.current = onClose;
  });
  const connectionResultRef = useRef<DeviceConnectionResult | undefined>(undefined);

  const runIdRef = useRef(0);
  const [phase, setPhase] = useState<StepPhase<RunIntent>>(() =>
    isReady ? buildPhase(buildIntent, input, 0) : { type: "pending" },
  );

  // The executor sheet and the error drawer also report a close on unmount and when the other
  // one takes over, which must not close the step: only a dismissal of the open one does.
  const isRunningRef = useRef(phase.type !== "failed");
  const isErrorDrawerOpenRef = useRef(phase.type === "failed");

  const applyPhase = useCallback((nextPhase: StepPhase<RunIntent>) => {
    isRunningRef.current = nextPhase.type === "running" || nextPhase.type === "pending";
    isErrorDrawerOpenRef.current = nextPhase.type === "failed";
    setPhase(nextPhase);
  }, []);

  const startRun = useCallback(() => {
    runIdRef.current += 1;
    applyPhase(buildPhase(buildIntentRef.current, input, runIdRef.current));
  }, [applyPhase, input]);

  useEffect(() => {
    if (phase.type === "pending" && isReady) startRun();
  }, [isReady, phase.type, startRun]);

  const close = useCallback(() => {
    isRunningRef.current = false;
    isErrorDrawerOpenRef.current = false;
    onCloseRef.current();
  }, []);

  const finish = close;

  const onUserCancel = useCallback(() => {
    if (isRunningRef.current) close();
  }, [close]);

  const onErrorDrawerClose = useCallback(() => {
    if (isErrorDrawerOpenRef.current) close();
  }, [close]);

  const isSheetOpen = phase.type === "running" || phase.type === "pending";
  // Lumen's sheet leaves the hardware Back to the screen behind it; the error drawer's modal
  // handles it on its own.
  useEffect(() => {
    if (!isSheetOpen) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!isLocked) onUserCancel();
      return true;
    });
    return () => subscription.remove();
  }, [isLocked, isSheetOpen, onUserCancel]);

  const retry = startRun;

  const showScene = useCallback(
    (scene: Scene) => applyPhase({ type: "failed", scene }),
    [applyPhase],
  );

  const onExecutorStateChanged = useCallback((executorState: ExecutorState) => {
    if ("connectionResult" in executorState) {
      connectionResultRef.current = executorState.connectionResult;
    }
  }, []);

  const onIntentJobStateChanged = useCallback(
    (jobState: LedgerSyncJobState) => {
      if (jobState.type === "device-rejected") {
        onDeviceRejectedRef.current?.(connectionResultRef.current);
      } else if (jobState.type === "failed") {
        showScene(sceneOfFailure(jobState.reason, jobState.error));
      }
    },
    [showScene],
  );

  const goToDelete = useCallback(
    () => showScene({ kind: SceneKind.ConfirmDeleteWrongSeedError }),
    [showScene],
  );

  const backToWrongSeedError = useCallback(
    () => showScene({ kind: SceneKind.AlreadySecuredOtherSeed }),
    [showScene],
  );

  const confirmDeleteKey = useCallback(async () => {
    await deleteMutation.mutateAsync();
    close();
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncManageKeyDeleteSuccess,
    });
  }, [close, deleteMutation, navigation]);

  const errorDrawerProps: DrawerProps = {
    scene: phase.type === "failed" ? phase.scene : { kind: SceneKind.Loader },
    retry,
    goToDelete,
    backToWrongSeedError,
    confirmDeleteKey,
  };

  return {
    phase,
    errorDrawerProps,
    finish,
    onErrorDrawerClose,
    onUserCancel,
    onExecutorStateChanged,
    onIntentJobStateChanged,
  };
}
