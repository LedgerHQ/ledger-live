import {
  DeviceActionStatus,
  DeviceLockedError,
  DeviceModelId,
  DmkResultStatus,
  RefusedByUserDAError,
  UnknownDAError,
  UserInteractionRequired,
  type ConnectedDevice,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import type {
  Backup,
  CreateBackupDAInput,
  CreateBackupDeviceAction,
} from "@ledgerhq/dmk-ledger-wallet";
import { Subject } from "rxjs";
import { createActor, fromCallback, type Actor, type AnyEventObject } from "xstate";
import { CreateBackupStateType, type CreateBackupState } from "../../api/model/CreateBackupState";
import {
  OsUpdatesOrchestratorStateMachineEventType,
  type OsUpdatesOrchestratorStateMachineActorRef,
  type OsUpdatesOrchestratorStateMachineEvent,
} from "../orchestrator/types";
import { POLL_INTERVAL_MS, SESSION_SETTLE_TIMEOUT_MS } from "../shared/constants";
import { createBackupStateMachine } from "./CreateBackupStateMachine";
import { BACKUP_MAX_AGE_MS } from "./constants";
import type { CreateBackupStateMachineInput } from "./types";

const SESSION_ID = "session-id";
const DEVICE_ID = "device-id";

const CONNECTED_DEVICE: ConnectedDevice = {
  id: DEVICE_ID,
  sessionId: SESSION_ID,
  modelId: DeviceModelId.STAX,
  transport: "RN_BLE",
} as ConnectedDevice;

const NOW = new Date("2026-09-15T12:00:00.000Z");

const backupCreatedAt = (createdAt: Date): Backup => ({
  languageId: undefined,
  installedApps: [],
  clsHexImage: undefined,
  createdAt,
});

const FRESH_BACKUP = backupCreatedAt(new Date(NOW.getTime() - BACKUP_MAX_AGE_MS + 1_000));
const STALE_BACKUP = backupCreatedAt(new Date(NOW.getTime() - BACKUP_MAX_AGE_MS));
const NEW_BACKUP = backupCreatedAt(NOW);

const success = (data: unknown) => ({ status: DmkResultStatus.Success, data });

type DeviceActionRun = {
  states: Subject<unknown>;
  cancel: jest.Mock;
};

describe("CreateBackupStateMachine", () => {
  let deviceActionRuns: DeviceActionRun[];
  let sendCommand: jest.Mock;
  let getBackup: jest.Mock;
  let saveBackup: jest.Mock;
  let parentEvents: OsUpdatesOrchestratorStateMachineEvent[];
  let parentRef: OsUpdatesOrchestratorStateMachineActorRef;
  let dmk: DeviceManagementKit;
  let actor: Actor<typeof createBackupStateMachine>;

  /** Flushes the microtask queue without firing any of the machine's delays. */
  const settle = async () => {
    for (let i = 0; i < 10; i++) {
      await jest.advanceTimersByTimeAsync(0);
    }
  };

  const start = (overrides: Partial<CreateBackupStateMachineInput> = {}) => {
    actor = createActor(createBackupStateMachine, {
      input: {
        dmk,
        connectedDevice: CONNECTED_DEVICE,
        storage: { getBackup, saveBackup },
        parentRef,
        ...overrides,
      },
    });
    actor.start();
    return settle();
  };

  const latestRun = () => deviceActionRuns[deviceActionRuns.length - 1];

  const latestDeviceActionInput = (): CreateBackupDAInput => {
    const calls = (dmk.executeDeviceAction as jest.Mock).mock.calls;
    const [{ deviceAction }] = calls[calls.length - 1];
    return (deviceAction as CreateBackupDeviceAction).input;
  };

  const emitPending = async (requiredUserInteraction: UserInteractionRequired) => {
    latestRun().states.next({
      status: DeviceActionStatus.Pending,
      intermediateValue: { requiredUserInteraction },
    });
    await settle();
  };

  const completeDeviceAction = async (output: unknown) => {
    const run = latestRun();
    run.states.next({ status: DeviceActionStatus.Completed, output });
    run.states.complete();
    await settle();
  };

  const failDeviceAction = async (error: unknown) => {
    const run = latestRun();
    run.states.next({ status: DeviceActionStatus.Error, error });
    run.states.complete();
    await settle();
  };

  const sentStates = () =>
    parentEvents
      .filter(event => event.type === OsUpdatesOrchestratorStateMachineEventType.STATE_UPDATE)
      .map(event => event.state as CreateBackupState);

  const sentStateTypes = () => sentStates().map(state => state.type);

  const lastSentStateType = () => {
    const types = sentStateTypes();
    return types[types.length - 1];
  };

  const sentStatesOfType = <TType extends CreateBackupStateType>(type: TType) =>
    sentStates().filter((state): state is Extract<CreateBackupState, { type: TType }> =>
      Boolean(state.type === type),
    );

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    deviceActionRuns = [];
    sendCommand = jest.fn(async () => success({ name: "BOLOS", version: "2.2.3" }));
    getBackup = jest.fn(async () => undefined);
    saveBackup = jest.fn(async () => undefined);
    parentEvents = [];
    const parentActor = createActor(
      fromCallback<AnyEventObject>(({ receive }) => {
        receive(event => parentEvents.push(event as OsUpdatesOrchestratorStateMachineEvent));
      }),
    );
    parentActor.start();
    parentRef = parentActor as unknown as OsUpdatesOrchestratorStateMachineActorRef;
    dmk = {
      executeDeviceAction: jest.fn(() => {
        const run: DeviceActionRun = {
          states: new Subject(),
          cancel: jest.fn(),
        };
        deviceActionRuns.push(run);
        return { observable: run.states.asObservable(), cancel: run.cancel };
      }),
      sendCommand,
      getDeviceSessionState: jest.fn(() => ({
        subscribe: () => ({ unsubscribe: jest.fn() }),
      })),
      listenToAvailableDevices: jest.fn(() => ({
        subscribe: () => ({ unsubscribe: jest.fn() }),
      })),
      connect: jest.fn(async () => SESSION_ID),
    } as unknown as DeviceManagementKit;
  });

  afterEach(() => {
    actor?.stop();
    parentRef.stop?.();
    jest.useRealTimers();
  });

  describe("existing backup", () => {
    it("should reuse a backup created less than 24h ago without asking the user", async () => {
      getBackup.mockResolvedValue(FRESH_BACKUP);

      await start();

      expect(getBackup).toHaveBeenCalledWith(DEVICE_ID);
      expect(actor.getSnapshot().status).toBe("done");
      expect(deviceActionRuns).toHaveLength(0);
      expect(saveBackup).not.toHaveBeenCalled();
      expect(sentStateTypes()).toEqual([]);
    });

    it("should ask the user what to do with a backup created 24h ago or more", async () => {
      getBackup.mockResolvedValue(STALE_BACKUP);

      await start();

      expect(lastSentStateType()).toBe(CreateBackupStateType.AWAITING_BACKUP_SELECTION);
      expect(actor.getSnapshot().value).toBe("AwaitingBackupSelection");
      expect(deviceActionRuns).toHaveLength(0);
    });

    it("should complete without creating a new backup when the user keeps the existing one", async () => {
      getBackup.mockResolvedValue(STALE_BACKUP);
      await start();

      sentStatesOfType(CreateBackupStateType.AWAITING_BACKUP_SELECTION)[0].useExistingBackup();
      await settle();

      expect(actor.getSnapshot().status).toBe("done");
      expect(deviceActionRuns).toHaveLength(0);
      expect(saveBackup).not.toHaveBeenCalled();
    });

    it("should create a new backup when the user asks for one", async () => {
      getBackup.mockResolvedValue(STALE_BACKUP);
      await start();

      sentStatesOfType(CreateBackupStateType.AWAITING_BACKUP_SELECTION)[0].createNewBackup();
      await settle();

      expect(actor.getSnapshot().value).toBe("CreateBackup");
      expect(deviceActionRuns).toHaveLength(1);
    });

    it("should create a backup right away when the device has none", async () => {
      await start();

      expect(actor.getSnapshot().value).toBe("CreateBackup");
      expect(deviceActionRuns).toHaveLength(1);
      expect(sentStateTypes()).toEqual([CreateBackupStateType.LOADING]);
    });

    it("should emit UNEXPECTED_ERROR when reading the existing backup rejects", async () => {
      getBackup.mockRejectedValue(new Error("storage unavailable"));

      await start();

      expect(actor.getSnapshot().value).toBe("UnrecoverableError");
      expect(lastSentStateType()).toBe(CreateBackupStateType.UNEXPECTED_ERROR);
    });
  });

  describe("backup creation", () => {
    it("should pass the unlock timeout down when creating the backup", async () => {
      await start({ unlockTimeout: 5_000 });

      expect(latestDeviceActionInput()).toEqual({ unlockTimeout: 5_000 });
    });

    it("should default the unlock timeout to zero when creating the backup", async () => {
      await start();

      expect(latestDeviceActionInput()).toEqual({ unlockTimeout: 0 });
    });

    it("should emit DEVICE_LOCKED while the backup creation waits for an unlock", async () => {
      await start();

      await emitPending(UserInteractionRequired.UnlockDevice);

      expect(lastSentStateType()).toBe(CreateBackupStateType.DEVICE_LOCKED);
    });

    it("should emit AWAITING_ALLOW_SECURE_CONNECTION while the backup creation opens a secure channel", async () => {
      await start();

      await emitPending(UserInteractionRequired.AllowSecureConnection);

      expect(lastSentStateType()).toBe(CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION);
    });

    it("should emit LOADING when the backup creation needs no user interaction", async () => {
      await start();

      await emitPending(UserInteractionRequired.UnlockDevice);
      await emitPending(UserInteractionRequired.None);

      expect(lastSentStateType()).toBe(CreateBackupStateType.LOADING);
    });

    it("should emit each state only once while consecutive snapshots require the same interaction", async () => {
      await start();

      await emitPending(UserInteractionRequired.AllowSecureConnection);
      await emitPending(UserInteractionRequired.AllowSecureConnection);

      expect(sentStatesOfType(CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION)).toHaveLength(
        1,
      );
    });

    it("should save the created backup and complete", async () => {
      await start();

      await completeDeviceAction(NEW_BACKUP);

      expect(saveBackup).toHaveBeenCalledWith(DEVICE_ID, NEW_BACKUP);
      expect(actor.getSnapshot().status).toBe("done");
    });

    it("should emit UNEXPECTED_ERROR when saving the created backup rejects", async () => {
      saveBackup.mockRejectedValue(new Error("storage unavailable"));
      await start();

      await completeDeviceAction(NEW_BACKUP);

      expect(actor.getSnapshot().value).toBe("UnrecoverableError");
      expect(lastSentStateType()).toBe(CreateBackupStateType.UNEXPECTED_ERROR);
    });
  });

  describe("error", () => {
    it("should emit ALLOW_SECURE_CONNECTION_REFUSED when the user refuses the secure connection", async () => {
      await start();

      await failDeviceAction(new RefusedByUserDAError());

      expect(actor.getSnapshot().value).toBe("AllowSecureConnectionRefused");
      expect(lastSentStateType()).toBe(CreateBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED);
    });

    it("should create the backup again when retry is called after the secure connection was refused", async () => {
      await start();
      await failDeviceAction(new RefusedByUserDAError());

      sentStatesOfType(CreateBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED)[0].retry();
      await settle();

      expect(actor.getSnapshot().value).toBe("CreateBackup");
      expect(deviceActionRuns).toHaveLength(2);
    });

    it("should send STOP to the parent when cancel is called after the secure connection was refused", async () => {
      await start();
      await failDeviceAction(new RefusedByUserDAError());

      sentStatesOfType(CreateBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED)[0].cancel();
      await settle();

      expect(parentEvents).toContainEqual({
        type: OsUpdatesOrchestratorStateMachineEventType.STOP,
      });
      expect(actor.getSnapshot().value).toBe("Canceled");
    });

    it("should hand a failed backup creation over to CheckErrorCause", async () => {
      sendCommand.mockResolvedValue({
        status: DmkResultStatus.Error,
        error: new DeviceLockedError(),
      });
      await start();

      await failDeviceAction(new DeviceLockedError());

      expect(actor.getSnapshot().value).toBe("CheckErrorCause");
      expect(lastSentStateType()).toBe(CreateBackupStateType.DEVICE_LOCKED);
    });

    it("should emit LOADING and create the backup again once recovered", async () => {
      sendCommand.mockResolvedValue({
        status: DmkResultStatus.Error,
        error: new DeviceLockedError(),
      });
      await start();
      await failDeviceAction(new DeviceLockedError());

      sendCommand.mockResolvedValue(success({ name: "BOLOS", version: "2.2.3" }));
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(actor.getSnapshot().value).toBe("CreateBackup");
      expect(lastSentStateType()).toBe(CreateBackupStateType.LOADING);
      expect(deviceActionRuns).toHaveLength(2);
    });

    it("should send STOP to the parent when cancel is called on the UNEXPECTED_ERROR state", async () => {
      getBackup.mockRejectedValue(new Error("storage unavailable"));
      await start();

      sentStatesOfType(CreateBackupStateType.UNEXPECTED_ERROR)[0].cancel();
      await settle();

      expect(parentEvents).toContainEqual({
        type: OsUpdatesOrchestratorStateMachineEventType.STOP,
      });
      expect(actor.getSnapshot().value).toBe("Canceled");
    });

    it("should emit UNEXPECTED_ERROR when the backup creation fails with an unrecoverable error", async () => {
      sendCommand.mockResolvedValue({
        status: DmkResultStatus.Error,
        error: new UnknownDAError("boom"),
      });
      await start();

      await failDeviceAction(new UnknownDAError("boom"));
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      expect(actor.getSnapshot().value).toBe("UnrecoverableError");
      expect(lastSentStateType()).toBe(CreateBackupStateType.UNEXPECTED_ERROR);
    });
  });
});
