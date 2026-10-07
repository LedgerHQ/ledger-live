import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DeviceStatus,
  GetOsVersionCommand,
  isSuccessCommandResult,
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
import {
  useBleDevicesScanning,
  useDeviceManagementKit,
  useHidDevicesDiscovery,
} from "@ledgerhq/live-dmk-mobile";
import type {
  DebugDiscoveredDevice,
  OrchestratorRunPhase,
  OsUpdatesOrchestratorDebugScreenViewModel,
  ProgressHistoryEntry,
} from "./types";

type Backup = NonNullable<Awaited<ReturnType<DeviceBackupStorage["getBackup"]>>>;
type OsUpdates = OsUpdatesOrchestratorUseCaseInput["osUpdates"];

const MS_PER_HOUR = 60 * 60 * 1000;
const MINUTES_PER_HOUR = 60;

/** Under the 24h threshold: create backup reuses it without asking. */
const VALID_BACKUP_AGE_MS = MS_PER_HOUR;

/** Past the 24h threshold: create backup asks whether to reuse it or make a new one. */
const EXPIRED_BACKUP_AGE_MS = 25 * MS_PER_HOUR;

function dummyBackup(ageMs: number): Backup {
  return {
    languageId: undefined,
    installedApps: [],
    clsHexImage: undefined,
    createdAt: new Date(Date.now() - ageMs),
  };
}

function formatAge(createdAt: Date): string {
  const hours = (Date.now() - createdAt.getTime()) / MS_PER_HOUR;
  return hours < 1
    ? `${Math.round(hours * MINUTES_PER_HOUR)} min old`
    : `${Math.round(hours)}h old`;
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
  const [isScanning, setIsScanning] = useState(false);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
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
      getBackup: deviceModelId => Promise.resolve(backupsRef.current[deviceModelId]),
      saveBackup: (deviceModelId, backup) => {
        setBackups(current => ({ ...current, [deviceModelId]: backup }));
        return Promise.resolve();
      },
      removeBackup: deviceModelId => {
        setBackups(current => {
          const next = { ...current };
          delete next[deviceModelId];
          return next;
        });
        return Promise.resolve();
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

  const { scannedDevices, scanningBleError } = useBleDevicesScanning(isScanning);
  const { hidDevices } = useHidDevicesDiscovery(isScanning);

  const discovered = useMemo(
    () => [...hidDevices, ...scannedDevices],
    [hidDevices, scannedDevices],
  );

  const discoveredDevices = useMemo<DebugDiscoveredDevice[]>(
    () =>
      discovered.map(({ deviceId, deviceName, discoveredDevice }) => ({
        id: deviceId,
        name: deviceName || discoveredDevice.deviceModel.name,
        transport: discoveredDevice.transport,
      })),
    [discovered],
  );

  const onToggleScan = useCallback(() => {
    setConnectError(null);
    setIsScanning(current => !current);
  }, []);

  const onConnectDevice = useCallback(
    (deviceId: string) => {
      const match = discovered.find(device => device.deviceId === deviceId);
      if (!dmk || !match) {
        return;
      }
      setConnectingDeviceId(deviceId);
      setConnectError(null);
      dmk
        // Same options as every reconnection the OS update performs: a session refresher polling
        // the device would send commands in the middle of an install.
        .connect({
          device: match.discoveredDevice,
          sessionRefresherOptions: { isRefresherDisabled: true },
        })
        .then(sessionId => {
          setConnectedDevice(dmk.getConnectedDevice({ sessionId }));
          setIsScanning(false);
        })
        .catch(error => {
          setConnectError(formatUnknown(error));
        })
        .finally(() => {
          setConnectingDeviceId(null);
        });
    },
    [discovered, dmk],
  );

  const onDisconnect = useCallback(() => {
    if (!dmk || !connectedDevice) {
      return;
    }
    const { sessionId } = connectedDevice;
    setConnectError(null);
    dmk
      .disconnect({ sessionId })
      .catch(() => undefined)
      .finally(() => {
        setConnectedDevice(getFirstConnectedDevice(dmk));
      });
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
        [connectedDevice.modelId]: dummyBackup(ageMs),
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
      delete next[connectedDevice.modelId];
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

    void (async () => {
      try {
        const result = await dmk.sendCommand({
          sessionId: device.sessionId,
          command: new GetOsVersionCommand(),
        });
        if (generation !== resolveGenerationRef.current) {
          return;
        }

        if (!isSuccessCommandResult(result)) {
          throw result.error;
        }

        if (result.data.isBootloader || result.data.isOsu) {
          startOrchestrator(device, []);
          return;
        }

        const resolvedOsUpdates = await new ResolveOsUpdatePathUseCase().execute({
          dmk,
          sessionId: device.sessionId,
          unlockTimeout: 0,
        });
        if (generation === resolveGenerationRef.current) {
          startOrchestrator(device, resolvedOsUpdates);
        }
      } catch (error) {
        if (generation !== resolveGenerationRef.current) {
          return;
        }
        setPhase("error");
        setErrorMessage(formatUnknown(error));
      }
    })();
  }, [dmk, startOrchestrator, stopRun]);

  const onStop = useCallback(() => {
    stopRun();
    setPhase("stopped");
  }, [stopRun]);

  const isBusy = phase === "resolving" || phase === "running";
  const connectionErrorMessage =
    connectError ?? (scanningBleError ? formatUnknown(scanningBleError) : null);
  const deviceId = connectedDevice?.id ?? null;
  const backup = connectedDevice !== null ? backups[connectedDevice.modelId] : undefined;

  return {
    dmkReady: Boolean(dmk),
    deviceId,
    sessionId: connectedDevice?.sessionId ?? null,
    deviceStatus,
    isScanning,
    discoveredDevices,
    connectingDeviceId,
    canDisconnect: Boolean(dmk && connectedDevice),
    connectionErrorMessage,
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
    onToggleScan,
    onConnectDevice,
    onDisconnect,
    onSeedBackup,
    onCloseSeedBackupSheet,
    onSeedValidBackup,
    onSeedExpiredBackup,
    onRemoveBackup,
    onStart,
    onStop,
  };
}
