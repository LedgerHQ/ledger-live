import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DeviceStatus,
  GetOsVersionCommand,
  isSuccessCommandResult,
  type ConnectedDevice,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  ResolveOsUpdatePathUseCase,
  type DeviceBackupStorage,
  type OsUpdatesOrchestratorUseCaseInput,
} from "@ledgerhq/live-dmk-shared";
import {
  useBleDevicesScanning,
  useDeviceManagementKit,
  useHidDevicesDiscovery,
} from "@ledgerhq/live-dmk-mobile";
import { useKeepScreenAwake } from "~/hooks/useKeepScreenAwake";
import { deviceBackupStorage } from "../storage/deviceBackupStorage";
import type {
  DebugDiscoveredDevice,
  OrchestratorRun,
  OrchestratorRunPhase,
  OsUpdatesOrchestratorDebugScreenViewModel,
  WhatsNew,
} from "./types";

type Backup = NonNullable<Awaited<ReturnType<DeviceBackupStorage["getBackup"]>>>;
type OsUpdates = OsUpdatesOrchestratorUseCaseInput["osUpdates"];
type PendingRun = { device: ConnectedDevice; osUpdates: OsUpdates };

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
  const [backup, setBackup] = useState<Backup | undefined>(undefined);
  const [isSeedBackupSheetOpen, setSeedBackupSheetOpen] = useState(false);
  const [phase, setPhase] = useState<OrchestratorRunPhase>("idle");
  const [orchestratorRun, setOrchestratorRun] = useState<OrchestratorRun | null>(null);
  const [pendingRun, setPendingRun] = useState<PendingRun | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resolveGenerationRef = useRef(0);

  // Same persistence as the product, mirrored in state so this screen shows the stored backup.
  const storage = useMemo<DeviceBackupStorage>(
    () => ({
      getBackup: deviceModelId => deviceBackupStorage.getBackup(deviceModelId),
      saveBackup: async (deviceModelId, nextBackup) => {
        await deviceBackupStorage.saveBackup(deviceModelId, nextBackup);
        setBackup(nextBackup);
      },
      removeBackup: async deviceModelId => {
        await deviceBackupStorage.removeBackup(deviceModelId);
        setBackup(undefined);
      },
    }),
    [],
  );

  const modelId = connectedDevice?.modelId;
  useEffect(() => {
    if (modelId === undefined) {
      return;
    }
    let isCurrent = true;
    storage
      .getBackup(modelId)
      .then(stored => {
        if (isCurrent) setBackup(stored);
      })
      .catch(() => {
        if (isCurrent) setBackup(undefined);
      });
    return () => {
      isCurrent = false;
    };
  }, [modelId, storage]);

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
    setOrchestratorRun(null);
    setPendingRun(null);
  }, []);

  useEffect(() => stopRun, [stopRun]);

  const seedBackup = useCallback(
    (ageMs: number) => {
      setSeedBackupSheetOpen(false);
      if (!connectedDevice) {
        return;
      }
      void storage.saveBackup(connectedDevice.modelId, dummyBackup(ageMs));
    },
    [connectedDevice, storage],
  );

  const onSeedBackup = useCallback(() => setSeedBackupSheetOpen(true), []);

  const onCloseSeedBackupSheet = useCallback(() => setSeedBackupSheetOpen(false), []);

  const onSeedValidBackup = useCallback(() => seedBackup(VALID_BACKUP_AGE_MS), [seedBackup]);

  const onSeedExpiredBackup = useCallback(() => seedBackup(EXPIRED_BACKUP_AGE_MS), [seedBackup]);

  const onRemoveBackup = useCallback(() => {
    if (!connectedDevice) {
      return;
    }
    void storage.removeBackup(connectedDevice.modelId);
  }, [connectedDevice, storage]);

  const startOrchestrator = useCallback(
    (device: ConnectedDevice, resolvedOsUpdates: OsUpdates) => {
      if (!dmk) {
        return;
      }

      setOrchestratorRun({
        dmk,
        connectedDevice: device,
        osUpdates: resolvedOsUpdates,
        storage,
        onStop: () => {
          setOrchestratorRun(null);
          setPhase("stopped");
        },
      });
      setPhase("running");
    },
    [dmk, storage],
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
    setErrorMessage(null);

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
        if (generation !== resolveGenerationRef.current) {
          return;
        }

        if (resolvedOsUpdates.length === 0) {
          startOrchestrator(device, resolvedOsUpdates);
          return;
        }

        setPendingRun({ device, osUpdates: resolvedOsUpdates });
        setPhase("reviewing");
      } catch (error) {
        if (generation !== resolveGenerationRef.current) {
          return;
        }
        setPhase("error");
        setErrorMessage(formatUnknown(error));
      }
    })();
  }, [dmk, startOrchestrator, stopRun]);

  const onConfirmStart = useCallback(() => {
    if (!pendingRun) {
      return;
    }
    setPendingRun(null);
    startOrchestrator(pendingRun.device, pendingRun.osUpdates);
  }, [pendingRun, startOrchestrator]);

  const whatsNew = useMemo<WhatsNew | null>(() => {
    const lastOsUpdate = pendingRun?.osUpdates.at(-1);
    return lastOsUpdate
      ? {
          version: lastOsUpdate.finalFirmware.version,
          notes: lastOsUpdate.osuFirmware.notes,
        }
      : null;
  }, [pendingRun]);

  const onStop = useCallback(() => {
    stopRun();
    setPhase("stopped");
  }, [stopRun]);

  const isBusy = phase === "resolving" || phase === "reviewing" || phase === "running";
  useKeepScreenAwake(phase === "running");
  const connectionErrorMessage =
    connectError ?? (scanningBleError ? formatUnknown(scanningBleError) : null);
  const deviceId = connectedDevice?.id ?? null;
  const shownBackup = connectedDevice === null ? undefined : backup;

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
    hasBackup: shownBackup !== undefined,
    backupAge: shownBackup ? formatAge(shownBackup.createdAt) : null,
    isSeedBackupSheetOpen,
    canStart: Boolean(dmk && connectedDevice && !isBusy),
    canStop: isBusy,
    isBusy,
    phase,
    orchestratorRun,
    whatsNew,
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
    onConfirmStart,
    onStop,
  };
}
