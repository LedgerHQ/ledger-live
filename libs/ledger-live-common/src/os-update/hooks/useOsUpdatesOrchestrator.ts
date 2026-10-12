import { useEffect, useRef, useState } from "react";
import {
  OsUpdatesOrchestratorUseCase,
  type OsUpdatesOrchestratorUseCaseInput,
  type OsUpdatesProgress,
} from "@ledgerhq/live-dmk-shared";

export const PROGRESS_THROTTLE_MS = 500;

function isProgressTick(previous: OsUpdatesProgress, next: OsUpdatesProgress): boolean {
  return (
    previous.step === next.step &&
    previous.state.type === next.state.type &&
    "progress" in next.state
  );
}

export function useOsUpdatesOrchestrator({
  dmk,
  connectedDevice,
  osUpdates,
  storage,
  onStop,
  unlockTimeout,
}: OsUpdatesOrchestratorUseCaseInput): { osUpdatesProgress: OsUpdatesProgress | null } {
  const [osUpdatesProgress, setOsUpdatesProgress] = useState<OsUpdatesProgress | null>(null);

  const onStopRef = useRef(onStop);
  const unlockTimeoutRef = useRef(unlockTimeout);
  useEffect(() => {
    onStopRef.current = onStop;
    unlockTimeoutRef.current = unlockTimeout;
  });

  useEffect(() => {
    let isTearingDown = false;

    let lastEmitted: OsUpdatesProgress | null = null;
    let lastEmittedAt = 0;
    let pending: OsUpdatesProgress | null = null;
    let pendingTimer: ReturnType<typeof setTimeout> | undefined;

    const clearPending = () => {
      clearTimeout(pendingTimer);
      pendingTimer = undefined;
      pending = null;
    };

    const emit = (progress: OsUpdatesProgress) => {
      clearPending();
      lastEmitted = progress;
      lastEmittedAt = Date.now();
      setOsUpdatesProgress(progress);
    };

    const onProgress = (next: OsUpdatesProgress) => {
      if (lastEmitted === null || !isProgressTick(lastEmitted, next)) {
        emit(next);
        return;
      }

      const wait = lastEmittedAt + PROGRESS_THROTTLE_MS - Date.now();
      if (wait <= 0) {
        emit(next);
        return;
      }

      pending = next;
      pendingTimer ??= setTimeout(() => {
        if (pending) emit(pending);
      }, wait);
    };

    const orchestrator = new OsUpdatesOrchestratorUseCase().execute({
      dmk,
      connectedDevice,
      osUpdates,
      storage,
      unlockTimeout: unlockTimeoutRef.current,
      onStop: () => {
        if (!isTearingDown) onStopRef.current();
      },
    });

    const subscription = orchestrator.subscribe(onProgress);
    orchestrator.start();

    return () => {
      isTearingDown = true;
      clearPending();
      subscription.unsubscribe();
      orchestrator.stop();
    };
  }, [dmk, connectedDevice, osUpdates, storage]);

  return { osUpdatesProgress };
}
