import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { DeviceConnectionResult, ExecutorState } from "@features/platform-device-intent";
import type {
  LedgerSyncFailureReason,
  LedgerSyncJobState,
} from "@features/platform-intent-wallet-sync";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { useDestroyTrustchain } from "../hooks/useDestroyTrustchain";
import { type DrawerProps, SceneKind } from "../hooks/useFollowInstructionDrawer";

type Scene = DrawerProps["scene"];

type StepPhase<RunIntent> =
  | { type: "running"; runId: number; intent: RunIntent }
  | { type: "failed"; scene: Scene }
  | { type: "done" };

export type LedgerSyncIntentStep<RunIntent> = Readonly<{
  phase: StepPhase<RunIntent>;
  /** Props of the existing error drawer, shown once a run failed. */
  errorDrawerProps: DrawerProps;
  /** Unmounts the executor before the host leaves the screen with the result. */
  finish: () => void;
  /** Closes the error drawer and leaves, only on a dismissal: not on Retry nor on a blur. */
  onErrorDrawerClose: () => void;
  onUserCancel: () => void;
  onExecutorStateChanged: (executorState: ExecutorState) => void;
  onIntentJobStateChanged: (jobState: LedgerSyncJobState) => void;
}>;

type Params<RunIntent> = Readonly<{
  /** Builds the intent of one run; a throw shows the generic error. */
  buildIntent: () => RunIntent;
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

function buildPhase<RunIntent>(buildIntent: () => RunIntent, runId: number): StepPhase<RunIntent> {
  try {
    return { type: "running", runId, intent: buildIntent() };
  } catch (error) {
    return { type: "failed", scene: { kind: SceneKind.GenericError, error: toError(error) } };
  }
}

/**
 * Drives one Ledger Sync device step on DIE: one executor per run, then the existing
 * error scenes when a run fails. Retry starts a new run with a fresh intent.
 */
export function useLedgerSyncIntentStep<RunIntent>({
  buildIntent,
  onDeviceRejected,
}: Params<RunIntent>): LedgerSyncIntentStep<RunIntent> {
  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();
  const { deleteMutation } = useDestroyTrustchain();
  const buildIntentRef = useRef(buildIntent);
  const onDeviceRejectedRef = useRef(onDeviceRejected);
  useLayoutEffect(() => {
    buildIntentRef.current = buildIntent;
    onDeviceRejectedRef.current = onDeviceRejected;
  });
  const connectionResultRef = useRef<DeviceConnectionResult | undefined>(undefined);
  // The sheet reports a close when its screen loses focus, which must not leave the next screen.
  const isOverRef = useRef(false);
  // The drawer also reports a close when it unmounts (Retry, screen removed) or loses focus.
  const isErrorDrawerOpenRef = useRef(false);
  useEffect(
    () => () => {
      isErrorDrawerOpenRef.current = false;
    },
    [],
  );

  const runIdRef = useRef(0);
  const [phase, setPhase] = useState<StepPhase<RunIntent>>(() => buildPhase(buildIntent, 0));

  const showScene = useCallback((scene: Scene) => {
    isOverRef.current = true;
    isErrorDrawerOpenRef.current = true;
    setPhase({ type: "failed", scene });
  }, []);

  const finish = useCallback(() => {
    isOverRef.current = true;
    setPhase({ type: "done" });
  }, []);

  const leave = useCallback(() => {
    isOverRef.current = true;
    navigation.goBack();
  }, [navigation]);

  const onUserCancel = useCallback(() => {
    if (!isOverRef.current) leave();
  }, [leave]);

  const onErrorDrawerClose = useCallback(() => {
    if (!isErrorDrawerOpenRef.current || !navigation.isFocused()) return;
    isErrorDrawerOpenRef.current = false;
    leave();
  }, [leave, navigation]);

  const retry = useCallback(() => {
    runIdRef.current += 1;
    const nextPhase = buildPhase(buildIntentRef.current, runIdRef.current);
    isErrorDrawerOpenRef.current = nextPhase.type === "failed";
    isOverRef.current = nextPhase.type !== "running";
    setPhase(nextPhase);
  }, []);

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
    navigation.navigate(ScreenName.WalletSyncManageKeyDeleteSuccess);
  }, [deleteMutation, navigation]);

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
