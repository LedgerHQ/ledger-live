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
  RestoreBackupDAInput,
  RestoreBackupDeviceAction,
  RestoreBackupDAOutput,
} from "@ledgerhq/dmk-ledger-wallet";
import { Subject } from "rxjs";
import { createActor, fromCallback, type Actor, type AnyEventObject } from "xstate";
import {
  RestoreBackupStateType,
  type RestoreBackupState,
} from "../../api/model/RestoreBackupState";
import {
  OsUpdatesOrchestratorStateMachineEventType,
  type OsUpdatesOrchestratorStateMachineActorRef,
  type OsUpdatesOrchestratorStateMachineEvent,
} from "../orchestrator/types";
import { POLL_INTERVAL_MS, SESSION_SETTLE_TIMEOUT_MS } from "../shared/constants";
import { RestoreBackupStepValue } from "./constants";
import { restoreBackupStateMachine } from "./RestoreBackupStateMachine";
import type { RestoreBackupStateMachineInput } from "./types";

const SESSION_ID = "session-id";
const DEVICE_ID = "device-id";

const CONNECTED_DEVICE: ConnectedDevice = {
  id: DEVICE_ID,
  sessionId: SESSION_ID,
  modelId: DeviceModelId.STAX,
  transport: "USB",
} as ConnectedDevice;

const EMPTY_BACKUP: Backup = {
  languageId: undefined,
  installedApps: [],
  clsHexImage: undefined,
  createdAt: new Date("2026-09-15T12:00:00.000Z"),
};

const BACKUP: Backup = {
  ...EMPTY_BACKUP,
  installedApps: [{ appName: "Bitcoin", data: undefined }],
};

const RESTORE_RESULT = { restoredApps: [] } as unknown as RestoreBackupDAOutput;

const OUT_OF_MEMORY_ERROR = {
  _tag: "OutOfMemoryDAError",
  message: "no room left",
};

const success = (data: unknown) => ({ status: DmkResultStatus.Success, data });

type DeviceActionRun = {
  states: Subject<unknown>;
  cancel: jest.Mock;
};

describe("RestoreBackupStateMachine", () => {
  let deviceActionRuns: DeviceActionRun[];
  let sendCommand: jest.Mock;
  let getBackup: jest.Mock;
  let saveBackup: jest.Mock;
  let removeBackup: jest.Mock;
  let parentEvents: OsUpdatesOrchestratorStateMachineEvent[];
  let parentRef: OsUpdatesOrchestratorStateMachineActorRef;
  let dmk: DeviceManagementKit;
  let actor: Actor<typeof restoreBackupStateMachine>;

  /** Flushes the microtask queue without firing any of the machine's delays. */
  const settle = async () => {
    for (let i = 0; i < 10; i++) {
      await jest.advanceTimersByTimeAsync(0);
    }
  };

  const start = (overrides: Partial<RestoreBackupStateMachineInput> = {}) => {
    actor = createActor(restoreBackupStateMachine, {
      input: {
        dmk,
        connectedDevice: CONNECTED_DEVICE,
        storage: { getBackup, saveBackup, removeBackup },
        parentRef,
        ...overrides,
      },
    });
    actor.start();
    return settle();
  };

  const latestRun = () => deviceActionRuns[deviceActionRuns.length - 1];

  const latestDeviceActionInput = (): RestoreBackupDAInput => {
    const calls = (dmk.executeDeviceAction as jest.Mock).mock.calls;
    const [{ deviceAction }] = calls[calls.length - 1];
    return (deviceAction as RestoreBackupDeviceAction).input;
  };

  const emitPending = async (intermediateValue: unknown) => {
    latestRun().states.next({
      status: DeviceActionStatus.Pending,
      intermediateValue,
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
      .map(event => event.state);

  const sentStateTypes = () => sentStates().map(state => state.type);

  const lastSentStateType = () => {
    const types = sentStateTypes();
    return types[types.length - 1];
  };

  const sentStatesOfType = <TType extends RestoreBackupStateType>(type: TType) =>
    sentStates().filter((state): state is Extract<RestoreBackupState, { type: TType }> =>
      Boolean(state.type === type),
    );

  beforeEach(() => {
    jest.useFakeTimers();
    deviceActionRuns = [];
    sendCommand = jest.fn(async () => success({ name: "BOLOS", version: "2.2.3" }));
    getBackup = jest.fn(async () => BACKUP);
    saveBackup = jest.fn(async () => undefined);
    removeBackup = jest.fn(async () => undefined);
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
      getConnectedDevice: jest.fn(() => CONNECTED_DEVICE),
    } as unknown as DeviceManagementKit;
  });

  afterEach(() => {
    actor?.stop();
    parentRef.stop?.();
    jest.useRealTimers();
  });

  describe("entry", () => {
    it("should restore the backup the device was saved under", async () => {
      await start();

      expect(getBackup).toHaveBeenCalledWith(DeviceModelId.STAX);
      expect(actor.getSnapshot().value).toBe("RestoreBackup");
      expect(latestDeviceActionInput()).toEqual({
        backup: BACKUP,
        unlockTimeout: 0,
      });
    });

    it("should pass the unlock timeout down to the device action", async () => {
      await start({ unlockTimeout: 5_000 });

      expect(latestDeviceActionInput()).toEqual({
        backup: BACKUP,
        unlockTimeout: 5_000,
      });
    });

    it("should complete without restoring anything when the device has no backup", async () => {
      getBackup.mockResolvedValue(undefined);

      await start();

      expect(dmk.executeDeviceAction).not.toHaveBeenCalled();
      expect(removeBackup).toHaveBeenCalledWith(DeviceModelId.STAX);
      expect(actor.getSnapshot().status).toBe("done");
      expect(actor.getSnapshot().output).toEqual({ restoreResult: undefined });
    });

    it("should drop an empty backup without restoring anything", async () => {
      getBackup.mockResolvedValue(EMPTY_BACKUP);

      await start();

      expect(dmk.executeDeviceAction).not.toHaveBeenCalled();
      expect(removeBackup).toHaveBeenCalledWith(DeviceModelId.STAX);
      expect(actor.getSnapshot().status).toBe("done");
      expect(actor.getSnapshot().output).toEqual({ restoreResult: undefined });
    });

    it("should emit UNEXPECTED_ERROR when reading the backup rejects", async () => {
      getBackup.mockRejectedValue(new Error("storage unavailable"));

      await start();

      expect(actor.getSnapshot().value).toBe("UnrecoverableError");
      expect(lastSentStateType()).toBe(RestoreBackupStateType.UNEXPECTED_ERROR);
    });
  });

  describe("progress", () => {
    it("should report a bar of its own, whatever the flow it is part of", async () => {
      await start();

      await emitPending({
        requiredUserInteraction: UserInteractionRequired.None,
        step: RestoreBackupStepValue.InstallOrUpdateApps,
        progress: 0.5,
      });

      expect(sentStatesOfType(RestoreBackupStateType.RESTORING)).toContainEqual({
        type: RestoreBackupStateType.RESTORING,
        progress: 0.275,
      });
    });

    it("should report the same progress only once", async () => {
      await start();

      await emitPending({
        requiredUserInteraction: UserInteractionRequired.None,
        step: RestoreBackupStepValue.InstallOrUpdateApps,
        progress: 0.5,
      });
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.None,
        step: RestoreBackupStepValue.InstallOrUpdateApps,
        progress: 0.5,
      });

      const progresses = sentStatesOfType(RestoreBackupStateType.RESTORING).map(
        state => state.progress,
      );
      expect(new Set(progresses).size).toBe(progresses.length);
    });
  });

  describe("interactions", () => {
    it("should emit AWAITING_GRANT_CONSENT while the device waits for the user's consent", async () => {
      await start();

      await emitPending({
        requiredUserInteraction: UserInteractionRequired.GrantConsent,
        step: RestoreBackupStepValue.RequestMasterConsent,
      });

      expect(lastSentStateType()).toBe(RestoreBackupStateType.AWAITING_GRANT_CONSENT);
    });

    it("should emit AWAITING_ALLOW_LIST_APPS while the apps are being listed", async () => {
      await start();

      await emitPending({
        requiredUserInteraction: UserInteractionRequired.AllowListApps,
        step: RestoreBackupStepValue.InstallOrUpdateApps,
      });

      expect(lastSentStateType()).toBe(RestoreBackupStateType.AWAITING_ALLOW_LIST_APPS);
    });

    it("should emit AWAITING_CONFIRM_LOAD_IMAGE while the lock screen is uploaded", async () => {
      await start();

      await emitPending({
        requiredUserInteraction: UserInteractionRequired.ConfirmLoadImage,
        step: RestoreBackupStepValue.UploadCustomLockScreen,
      });

      expect(lastSentStateType()).toBe(RestoreBackupStateType.AWAITING_CONFIRM_LOAD_IMAGE);
    });

    it("should emit DEVICE_LOCKED while the device waits for an unlock", async () => {
      await start();

      await emitPending({
        requiredUserInteraction: UserInteractionRequired.UnlockDevice,
        step: RestoreBackupStepValue.InstallOrUpdateApps,
      });

      expect(lastSentStateType()).toBe(RestoreBackupStateType.DEVICE_LOCKED);
    });
  });

  describe("completion", () => {
    it("should drop the restored backup so a later run does not restore it again", async () => {
      await start();

      await completeDeviceAction(RESTORE_RESULT);

      expect(removeBackup).toHaveBeenCalledWith(DeviceModelId.STAX);
      expect(actor.getSnapshot().status).toBe("done");
    });

    it("should report the restore result", async () => {
      await start();

      await completeDeviceAction(RESTORE_RESULT);

      expect(sentStatesOfType(RestoreBackupStateType.BACKUP_RESTORED)[0].restoreResult).toBe(
        RESTORE_RESULT,
      );
      expect(actor.getSnapshot().output).toEqual({ restoreResult: RESTORE_RESULT });
    });

    it("should still complete when dropping the restored backup rejects", async () => {
      removeBackup.mockRejectedValue(new Error("storage unavailable"));
      await start();

      await completeDeviceAction(RESTORE_RESULT);

      expect(actor.getSnapshot().status).toBe("done");
      expect(lastSentStateType()).toBe(RestoreBackupStateType.BACKUP_RESTORED);
    });
  });

  describe("error", () => {
    it("should emit OUT_OF_MEMORY when the device runs out of room reinstalling the apps", async () => {
      await start();

      await failDeviceAction(OUT_OF_MEMORY_ERROR);

      expect(actor.getSnapshot().value).toBe("OutOfMemory");
      expect(lastSentStateType()).toBe(RestoreBackupStateType.OUT_OF_MEMORY);
    });

    it("should keep the backup when the device ran out of room, so it can be restored later", async () => {
      await start();

      await failDeviceAction(OUT_OF_MEMORY_ERROR);

      expect(removeBackup).not.toHaveBeenCalled();
    });

    it("should ask the host to stop when cancel is called on the OUT_OF_MEMORY state", async () => {
      await start();
      await failDeviceAction(OUT_OF_MEMORY_ERROR);

      sentStatesOfType(RestoreBackupStateType.OUT_OF_MEMORY)[0].cancel();
      await settle();

      expect(parentEvents).toContainEqual({
        type: OsUpdatesOrchestratorStateMachineEventType.STOP,
      });
      expect(actor.getSnapshot().value).toBe("Canceled");
    });

    it("should emit ALLOW_SECURE_CONNECTION_REFUSED when the user refuses the secure connection", async () => {
      await start();
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.AllowSecureConnection,
        step: RestoreBackupStepValue.InstallOrUpdateApps,
      });

      await failDeviceAction(new RefusedByUserDAError());

      expect(actor.getSnapshot().value).toBe("AllowSecureConnectionRefused");
      expect(lastSentStateType()).toBe(RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED);
    });

    it("should restore again when retry is called after a refused secure connection", async () => {
      await start();
      await failDeviceAction(new RefusedByUserDAError());

      sentStatesOfType(RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED)[0].retry();
      await settle();

      expect(actor.getSnapshot().value).toBe("RestoreBackup");
    });

    it("should ask the host to stop when cancel is called after a refused secure connection", async () => {
      await start();
      await failDeviceAction(new RefusedByUserDAError());

      sentStatesOfType(RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED)[0].cancel();
      await settle();

      expect(parentEvents).toContainEqual({
        type: OsUpdatesOrchestratorStateMachineEventType.STOP,
      });
      expect(actor.getSnapshot().value).toBe("Canceled");
    });

    it("should hand any other failure over to CheckErrorCause", async () => {
      await start();

      await failDeviceAction(new DeviceLockedError());

      expect(actor.getSnapshot().value).toBe("CheckErrorCause");
      expect(lastSentStateType()).toBe(RestoreBackupStateType.DEVICE_LOCKED);
    });

    it("should restore again once recovered", async () => {
      await start();
      await failDeviceAction(new DeviceLockedError());

      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(actor.getSnapshot().value).toBe("RestoreBackup");
    });

    it("should emit UNEXPECTED_ERROR when the restore fails with an unrecoverable error", async () => {
      await start();

      sendCommand.mockResolvedValue({
        status: DmkResultStatus.Error,
        error: new UnknownDAError("boom"),
      });
      await failDeviceAction(new UnknownDAError("boom"));
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      expect(actor.getSnapshot().value).toBe("UnrecoverableError");
      expect(lastSentStateType()).toBe(RestoreBackupStateType.UNEXPECTED_ERROR);
    });

    it("should ask the host to stop when cancel is called on the UNEXPECTED_ERROR state", async () => {
      await start();
      sendCommand.mockResolvedValue({
        status: DmkResultStatus.Error,
        error: new UnknownDAError("boom"),
      });
      await failDeviceAction(new UnknownDAError("boom"));
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      sentStatesOfType(RestoreBackupStateType.UNEXPECTED_ERROR)[0].cancel();
      await settle();

      expect(parentEvents).toContainEqual({
        type: OsUpdatesOrchestratorStateMachineEventType.STOP,
      });
      expect(actor.getSnapshot().value).toBe("Canceled");
    });
  });
});
