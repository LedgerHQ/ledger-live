import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DeviceStatus,
  type ConnectedDevice,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  OsUpdatesOrchestratorUseCase,
  ResolveOsUpdatePathUseCase,
  type DeviceBackupStorage,
  type OsUpdatesOrchestrator,
  type OsUpdatesOrchestratorUseCaseInput,
  type OsUpdatesProgress,
} from "@ledgerhq/live-dmk-shared";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import type {
  OrchestratorRunPhase,
  OsUpdatesOrchestratorDebugScreenViewModel,
  ProgressHistoryEntry,
} from "./types";

type Backup = NonNullable<Awaited<ReturnType<DeviceBackupStorage["getBackup"]>>>;
type OsUpdates = OsUpdatesOrchestratorUseCaseInput["osUpdates"];

/** Under the 24h threshold: create backup reuses it without asking. */
const VALID_BACKUP_AGE_MS = 60 * 60 * 1000;
/** Past the 24h threshold: create backup asks whether to reuse it or make a new one. */
const EXPIRED_BACKUP_AGE_MS = 25 * 60 * 60 * 1000;

function dummyBackup(ageMs: number): Backup {
  return {
    languageId: undefined,
    installedApps: [],
    clsHexImage: undefined,
    createdAt: new Date(Date.now() - ageMs),
  };
}

function formatAge(createdAt: Date): string {
  const hours = (Date.now() - createdAt.getTime()) / (60 * 60 * 1000);
  return hours < 1 ? `${Math.round(hours * 60)} min old` : `${Math.round(hours)}h old`;
}

function getFirstConnectedDevice(dmk: DeviceManagementKit | null): ConnectedDevice | null {
  if (!dmk) {
    return null;
  }
  return dmk.listConnectedDevices()[0] ?? null;
}

function formatUnknown(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function useOsUpdatesOrchestratorDebugScreenViewModel(): OsUpdatesOrchestratorDebugScreenViewModel {
  const dmk = useDeviceManagementKit();
  const [connectedDevice, setConnectedDevice] = useState<ConnectedDevice | null>(() =>
    getFirstConnectedDevice(dmk),
  );
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [backups, setBackups] = useState<Record<string, Backup>>({});
  const [isSeedBackupSheetOpen, setSeedBackupSheetOpen] = useState(false);
  const [phase, setPhase] = useState<OrchestratorRunPhase>("idle");
  const [progress, setProgress] = useState<OsUpdatesProgress | null>(null);
  const [history, setHistory] = useState<ProgressHistoryEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const backupsRef = useRef(backups);
  backupsRef.current = backups;

  const resolveGenerationRef = useRef(0);
  const orchestratorRef = useRef<OsUpdatesOrchestrator | null>(null);
  const orchestratorUnsubscribeRef = useRef<(() => void) | null>(null);
  const historyIdRef = useRef(0);

  const storage = useMemo<DeviceBackupStorage>(
    () => ({
      getBackup: async deviceId => backupsRef.current[deviceId],
      saveBackup: async (deviceId, backup) => {
        setBackups(current => ({ ...current, [deviceId]: backup }));
      },
    }),
    [],
  );

  useEffect(() => {
    setConnectedDevice(getFirstConnectedDevice(dmk));
    if (!dmk) {
      return;
    }
    const subscription = dmk.listenToConnectedDevice().subscribe({
      next: device => {
        setConnectedDevice(device);
      },
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [dmk]);

  useEffect(() => {
    if (!dmk || !connectedDevice) {
      setDeviceStatus(null);
      return;
    }

    let subscription: { unsubscribe: () => void } | undefined;
    const setDisconnected = () => {
      setDeviceStatus(DeviceStatus.NOT_CONNECTED);
    };

    try {
      subscription = dmk.getDeviceSessionState({ sessionId: connectedDevice.sessionId }).subscribe({
        next: state => {
          setDeviceStatus(state.deviceStatus);
        },
        error: setDisconnected,
        complete: setDisconnected,
      });
    } catch {
      setDisconnected();
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [connectedDevice, dmk]);

  const stopRun = useCallback(() => {
    resolveGenerationRef.current += 1;
    orchestratorUnsubscribeRef.current?.();
    orchestratorUnsubscribeRef.current = null;
    orchestratorRef.current?.stop();
    orchestratorRef.current = null;
  }, []);

  useEffect(() => stopRun, [stopRun]);

  const appendHistory = useCallback((next: OsUpdatesProgress) => {
    setHistory(current => {
      const latest = current[0];
      if (latest && latest.step === next.step && latest.stateType === next.state.type) {
        return current;
      }
      return [
        {
          id: historyIdRef.current++,
          time: new Date().toLocaleTimeString(),
          step: next.step,
          stateType: next.state.type,
        },
        ...current.slice(0, 19),
      ];
    });
  }, []);

  const seedBackup = useCallback(
    (ageMs: number) => {
      setSeedBackupSheetOpen(false);
      if (!connectedDevice) {
        return;
      }
      setBackups(current => ({
        ...current,
        [connectedDevice.id]: dummyBackup(ageMs),
      }));
    },
    [connectedDevice],
  );

  const onSeedBackup = useCallback(() => setSeedBackupSheetOpen(true), []);

  const onCloseSeedBackupSheet = useCallback(() => setSeedBackupSheetOpen(false), []);

  const onSeedValidBackup = useCallback(() => seedBackup(VALID_BACKUP_AGE_MS), [seedBackup]);

  const onSeedExpiredBackup = useCallback(() => seedBackup(EXPIRED_BACKUP_AGE_MS), [seedBackup]);

  const onRemoveBackup = useCallback(() => {
    if (!connectedDevice) {
      return;
    }
    setBackups(current => {
      const next = { ...current };
      delete next[connectedDevice.id];
      return next;
    });
  }, [connectedDevice]);

  const startOrchestrator = useCallback(
    (device: ConnectedDevice, resolvedOsUpdates: OsUpdates) => {
      if (!dmk) {
        return;
      }

      const orchestrator = new OsUpdatesOrchestratorUseCase().execute({
        dmk,
        connectedDevice: device,
        osUpdates: resolvedOsUpdates,
        storage,
        onStop: () => {
          setPhase("stopped");
        },
      });

      const subscription = orchestrator.subscribe(next => {
        setProgress(next);
        appendHistory(next);
      });
      orchestratorRef.current = orchestrator;
      orchestratorUnsubscribeRef.current = () => subscription.unsubscribe();
      setPhase("running");
      orchestrator.start();
    },
    [appendHistory, dmk, storage],
  );

  const onStart = useCallback(() => {
    const device = getFirstConnectedDevice(dmk);
    setConnectedDevice(device);

    if (!dmk || !device) {
      return;
    }

    stopRun();
    const generation = resolveGenerationRef.current;

    setPhase("resolving");
    setProgress(null);
    setHistory([]);
    setErrorMessage(null);
    historyIdRef.current = 0;

    void new ResolveOsUpdatePathUseCase()
      .execute({
        dmk,
        sessionId: device.sessionId,
        unlockTimeout: 0,
      })
      .then(resolvedOsUpdates => {
        if (generation !== resolveGenerationRef.current) {
          return;
        }
        startOrchestrator(device, resolvedOsUpdates);
      })
      .catch(error => {
        if (generation !== resolveGenerationRef.current) {
          return;
        }
        setPhase("error");
        setErrorMessage(formatUnknown(error));
      });
  }, [dmk, startOrchestrator, stopRun]);

  const onStop = useCallback(() => {
    stopRun();
    setPhase("stopped");
  }, [stopRun]);

  const isBusy = phase === "resolving" || phase === "running";
  const deviceId = connectedDevice?.id ?? null;
  const backup = deviceId !== null ? backups[deviceId] : undefined;

  return {
    dmkReady: Boolean(dmk),
    deviceId,
    sessionId: connectedDevice?.sessionId ?? null,
    deviceStatus,
    hasBackup: backup !== undefined,
    backupAge: backup ? formatAge(backup.createdAt) : null,
    isSeedBackupSheetOpen,
    canStart: Boolean(dmk && connectedDevice && !isBusy),
    canStop: isBusy,
    isBusy,
    phase,
    progress,
    history,
    errorMessage,
    onSeedBackup,
    onCloseSeedBackupSheet,
    onSeedValidBackup,
    onSeedExpiredBackup,
    onRemoveBackup,
    onStart,
    onStop,
  };
}
