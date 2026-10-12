import {
  DeviceActionStatus,
  DeviceLockedError,
  DeviceModelId,
  DmkResultStatus,
  GetOsVersionCommand,
  RefusedByUserDAError,
  UnknownDAError,
  UserInteractionRequired,
  type ConnectedDevice,
  type DeviceManagementKit,
  type DiscoveredDevice,
  type GetOsVersionResponse,
} from "@ledgerhq/device-management-kit";
import type {
  Backup,
  FlashMcuDAInput,
  FlashMcuDeviceAction,
  InstallOsUpdateDAInput,
  InstallOsUpdateDeviceAction,
  OsUpdate,
  RestoreBackupDAOutput,
} from "@ledgerhq/dmk-ledger-wallet";
import { Subject } from "rxjs";
import { createActor, fromCallback, type Actor, type AnyEventObject } from "xstate";
import { ApplyUpdatesStateType, type ApplyUpdatesState } from "../../api/model/ApplyUpdatesState";
import {
  OsUpdatesOrchestratorStateMachineEventType,
  type OsUpdatesOrchestratorStateMachineActorRef,
  type OsUpdatesOrchestratorStateMachineEvent,
} from "../orchestrator/types";
import { POLL_INTERVAL_MS, SESSION_SETTLE_TIMEOUT_MS } from "../shared/constants";
import { RestoreBackupStepValue } from "../restore-backup/constants";
import { applyUpdatesStateMachine } from "./ApplyUpdatesStateMachine";
import {
  MCU_FLASH_TARGET,
  REBOOT_SETTLE_DELAY_MS,
  WAIT_READY_TIMEOUT_AFTER_FLASH_MS,
  WAIT_READY_TIMEOUT_MS,
} from "./constants";
import type { ApplyUpdatesStateMachineInput } from "./types";

const SESSION_ID = "session-id";
const DEVICE_ID = "device-id";
const REDISCOVERED_DEVICE_ID = "rediscovered-device-id";

const CONNECTED_DEVICE: ConnectedDevice = {
  id: DEVICE_ID,
  sessionId: SESSION_ID,
  modelId: DeviceModelId.STAX,
  transport: "USB",
} as ConnectedDevice;

/** Same model under a new uid, which is what a USB reboot leaves discovery with. */
const REDISCOVERED_DEVICE: DiscoveredDevice = {
  id: REDISCOVERED_DEVICE_ID,
  name: "",
  deviceModel: { id: REDISCOVERED_DEVICE_ID, model: DeviceModelId.STAX, name: "Stax" },
  transport: "USB",
} as DiscoveredDevice;

const DASHBOARD = { name: "BOLOS", version: "2.2.3" };

const osUpdate = (overrides: Partial<OsUpdate> = {}): OsUpdate =>
  ({
    osuFirmware: {
      id: 1,
      perso: "perso_11",
      hash: null,
      firmware: "stax/2.3.0/fw_2.2.3/osu",
    },
    finalFirmware: {
      id: 2,
      perso: "perso_11",
      hash: null,
      version: "2.3.0",
      firmware: null,
    },
    shouldFlashMcu: false,
    ...overrides,
  }) as OsUpdate;

/** Nothing left to install once the OSU firmware is in, the common single-hop update. */
const SIMPLE_UPDATE = osUpdate();

const UPDATE_WITH_FINAL_FIRMWARE = osUpdate({
  finalFirmware: {
    id: 2,
    perso: "perso_11",
    hash: null,
    version: "2.3.0",
    firmware: "stax/2.3.0/fw_2.3.0",
  },
} as Partial<OsUpdate>);

const UPDATE_WITH_FLASH = osUpdate({ shouldFlashMcu: true });

const flashed = (target: "mcu" | "bootloader") => ({ target });

const osVersion = (overrides: Partial<GetOsVersionResponse> = {}): GetOsVersionResponse =>
  ({
    isBootloader: false,
    isOsu: false,
    seVersion: "2.2.3",
    ...overrides,
  }) as GetOsVersionResponse;

const ON_OS = osVersion();
const IN_BOOTLOADER = osVersion({ isBootloader: true });
const IN_OSU = osVersion({ isOsu: true });

const BACKUP: Backup = {
  languageId: undefined,
  installedApps: [{ appName: "Bitcoin", data: undefined }],
  clsHexImage: undefined,
  createdAt: new Date("2026-09-15T12:00:00.000Z"),
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

describe("ApplyUpdatesStateMachine", () => {
  let deviceActionRuns: DeviceActionRun[];
  let sendCommand: jest.Mock;
  let osVersionQueue: GetOsVersionResponse[];
  let availableDevices$: Subject<DiscoveredDevice[]>;
  let getBackup: jest.Mock;
  let saveBackup: jest.Mock;
  let removeBackup: jest.Mock;
  let parentEvents: OsUpdatesOrchestratorStateMachineEvent[];
  let parentRef: OsUpdatesOrchestratorStateMachineActorRef;
  let dmk: DeviceManagementKit;
  let actor: Actor<typeof applyUpdatesStateMachine>;

  /** Flushes the microtask queue without firing any of the machine's delays. */
  const settle = async () => {
    for (let i = 0; i < 10; i++) {
      await jest.advanceTimersByTimeAsync(0);
    }
  };

  /** What the next `GetOsVersion` answers, the last value staying in place once the queue is dry. */
  const nextOsVersion = (...responses: GetOsVersionResponse[]) => {
    osVersionQueue = responses;
  };

  const start = (overrides: Partial<ApplyUpdatesStateMachineInput> = {}) => {
    actor = createActor(applyUpdatesStateMachine, {
      input: {
        dmk,
        connectedDevice: CONNECTED_DEVICE,
        osUpdates: [SIMPLE_UPDATE],
        storage: { getBackup, saveBackup, removeBackup },
        parentRef,
        ...overrides,
      },
    });
    actor.start();
    return settle();
  };

  const latestRun = () => deviceActionRuns[deviceActionRuns.length - 1];

  const latestDeviceActionInput = <TInput>(): TInput => {
    const calls = (dmk.executeDeviceAction as jest.Mock).mock.calls;
    const [{ deviceAction }] = calls[calls.length - 1];
    return (deviceAction as { input: TInput }).input;
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

  /**
   * Waits out the reboot the way the machine does: settle, rediscover the device under a new uid,
   * reconnect under the same session id, then one successful read.
   */
  const completeWaitForDeviceReady = async () => {
    await jest.advanceTimersByTimeAsync(REBOOT_SETTLE_DELAY_MS);
    await settle();
    availableDevices$.next([REDISCOVERED_DEVICE]);
    await settle();
  };

  /**
   * Gets a device running an OS to the install: the machine reads the OS version first, and only
   * then checks the dashboard. A device in bootloader or OSU mode branches off before that, so it
   * starts with `start` alone.
   */
  const reachUpdateStart = async (input: Partial<ApplyUpdatesStateMachineInput> = {}) => {
    await start(input);
    await completeDeviceAction(DASHBOARD);
  };

  const sentStates = () =>
    parentEvents
      .filter(event => event.type === OsUpdatesOrchestratorStateMachineEventType.STATE_UPDATE)
      .map(event => event.state as ApplyUpdatesState);

  const sentStateTypes = () => sentStates().map(state => state.type);

  const lastSentStateType = () => {
    const types = sentStateTypes();
    return types[types.length - 1];
  };

  /** Where the restore step, which runs the tail of the update as a child, has got to. */
  const restoreChildState = () => actor.getSnapshot().children.restoreBackup?.getSnapshot().value;

  const sentStatesOfType = <TType extends ApplyUpdatesStateType>(type: TType) =>
    sentStates().filter((state): state is Extract<ApplyUpdatesState, { type: TType }> =>
      Boolean(state.type === type),
    );

  const hangOsVersionRead = () => {
    sendCommand.mockImplementation(async ({ command }) =>
      command instanceof GetOsVersionCommand ? new Promise(() => undefined) : success(DASHBOARD),
    );
  };

  const expectWaitResumedWithoutAnotherDeviceAction = async (
    waitState: string,
    timeoutMs: number,
  ) => {
    const runsBeforeRecovery = deviceActionRuns.length;
    hangOsVersionRead();

    await jest.advanceTimersByTimeAsync(timeoutMs);
    await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
    await settle();

    expect(actor.getSnapshot().value).toBe(waitState);
    expect(deviceActionRuns).toHaveLength(runsBeforeRecovery);
  };

  beforeEach(() => {
    jest.useFakeTimers();
    deviceActionRuns = [];
    osVersionQueue = [ON_OS];
    availableDevices$ = new Subject();
    sendCommand = jest.fn(async ({ command }) => {
      if (command instanceof GetOsVersionCommand) {
        return success(osVersionQueue.length > 1 ? osVersionQueue.shift() : osVersionQueue[0]);
      }
      return success(DASHBOARD);
    });
    getBackup = jest.fn(async () => undefined);
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
      listenToAvailableDevices: jest.fn(() => availableDevices$.asObservable()),
      connect: jest.fn(async () => SESSION_ID),
      disconnect: jest.fn(async () => undefined),
      stopDiscovering: jest.fn(async () => undefined),
      getConnectedDevice: jest.fn(() => ({
        ...CONNECTED_DEVICE,
        id: REDISCOVERED_DEVICE_ID,
      })),
    } as unknown as DeviceManagementKit;
  });

  afterEach(() => {
    actor?.stop();
    parentRef.stop?.();
    jest.useRealTimers();
  });

  describe("entry", () => {
    it("should go to the dashboard when the device is running an app", async () => {
      await start();

      await completeDeviceAction({ name: "Bitcoin", version: "2.1.0" });

      expect(actor.getSnapshot().value).toBe("GoToDashboard");
    });

    it("should check the app and version again once back on the dashboard", async () => {
      await start();
      await completeDeviceAction({ name: "Bitcoin", version: "2.1.0" });

      await completeDeviceAction(undefined);

      expect(actor.getSnapshot().value).toBe("WaitingForAppAndVersion");
    });

    it("should install the OSU firmware when the device is on a regular OS", async () => {
      await reachUpdateStart();

      expect(actor.getSnapshot().value).toBe("InstallOsu");
      expect(latestDeviceActionInput<InstallOsUpdateDAInput>()).toEqual({
        osUpdate: SIMPLE_UPDATE,
        unlockTimeout: 0,
      });
    });

    it("should pass the unlock timeout down to the device actions", async () => {
      await reachUpdateStart({ unlockTimeout: 5_000 });

      expect(latestDeviceActionInput<InstallOsUpdateDAInput>()).toEqual({
        osUpdate: SIMPLE_UPDATE,
        unlockTimeout: 5_000,
      });
    });

    it("should resolve the update path when the device is left in OSU mode", async () => {
      nextOsVersion(IN_OSU);

      await start();

      expect(actor.getSnapshot().value).toBe("ResolveAfterOsu");
    });

    it("should install the final firmware straight after resolving from OSU mode", async () => {
      nextOsVersion(IN_OSU);
      await start();

      await completeDeviceAction([UPDATE_WITH_FINAL_FIRMWARE]);

      expect(actor.getSnapshot().value).toBe("InstallFinalFirmware");
    });

    // The bootloader answers no app and version at all, so the branch has to be picked before any
    // device action runs.
    it("should flash in recovery mode when the device is left in bootloader mode", async () => {
      nextOsVersion(IN_BOOTLOADER);

      await start();

      expect(actor.getSnapshot().value).toBe("FlashMcuRecovery");
      expect(latestDeviceActionInput<FlashMcuDAInput>()).toEqual({
        mode: "bootloaderRecovery",
      });
    });

    it("should hand a failed app and version check over to CheckErrorCause", async () => {
      await start();

      await failDeviceAction(new DeviceLockedError());

      expect(actor.getSnapshot().value).toBe("CheckErrorCause");
      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.DEVICE_LOCKED);
    });

    it("should read the OS version again once recovered from a failed app and version check", async () => {
      await start();
      await failDeviceAction(new DeviceLockedError());

      nextOsVersion(IN_BOOTLOADER);
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      // Reaching the bootloader branch is only possible through a second OS version read.
      expect(actor.getSnapshot().value).toBe("FlashMcuRecovery");
      expect(sentStateTypes()).toContain(ApplyUpdatesStateType.LOADING);
    });

    it("should hand a failed OS version read over to CheckErrorCause", async () => {
      sendCommand.mockResolvedValue({
        status: DmkResultStatus.Error,
        error: new DeviceLockedError(),
      });

      await start();

      expect(actor.getSnapshot().value).toBe("CheckErrorCause");
    });
  });

  describe("install", () => {
    it("should wait for the device to come back once the OSU firmware is installed", async () => {
      await reachUpdateStart();

      await completeDeviceAction(undefined);

      expect(actor.getSnapshot().value).toBe("WaitForReadyAfterOsu");
    });

    it("should report AWAITING_UPDATE_COMPLETE once an OSU with nothing after it is installed", async () => {
      await reachUpdateStart();

      await completeDeviceAction(undefined);

      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE);
    });

    it("should not report AWAITING_UPDATE_COMPLETE after an OSU followed by a flash", async () => {
      await reachUpdateStart({ osUpdates: [UPDATE_WITH_FLASH] });

      await completeDeviceAction(undefined);

      expect(sentStateTypes()).not.toContain(ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE);
    });

    it("should not report AWAITING_UPDATE_COMPLETE after an OSU followed by a final firmware", async () => {
      await reachUpdateStart({ osUpdates: [UPDATE_WITH_FINAL_FIRMWARE] });

      await completeDeviceAction(undefined);

      expect(sentStateTypes()).not.toContain(ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE);
    });

    it("should report AWAITING_UPDATE_COMPLETE once the final firmware is installed", async () => {
      nextOsVersion(ON_OS, IN_OSU);
      await reachUpdateStart({ osUpdates: [UPDATE_WITH_FINAL_FIRMWARE] });
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();

      await completeDeviceAction(undefined);

      expect(actor.getSnapshot().value).toBe("WaitForReadyAfterFinalInstall");
      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE);
    });

    it("should complete the update once the rebooted device is back", async () => {
      await reachUpdateStart();
      await completeDeviceAction(undefined);

      await completeWaitForDeviceReady();

      expect(actor.getSnapshot().status).toBe("done");
      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.UPDATES_APPLIED);
    });

    it("should install the final firmware when the update has one", async () => {
      nextOsVersion(ON_OS, IN_OSU);
      await reachUpdateStart({ osUpdates: [UPDATE_WITH_FINAL_FIRMWARE] });
      await completeDeviceAction(undefined);

      await completeWaitForDeviceReady();

      expect(actor.getSnapshot().value).toBe("InstallFinalFirmware");
      expect(latestDeviceActionInput<InstallOsUpdateDAInput>()).toEqual({
        osUpdate: UPDATE_WITH_FINAL_FIRMWARE,
        unlockTimeout: 0,
      });
    });

    it("should complete the update once the final firmware is installed", async () => {
      nextOsVersion(ON_OS, IN_OSU, ON_OS);
      await reachUpdateStart({ osUpdates: [UPDATE_WITH_FINAL_FIRMWARE] });
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();

      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      expect(actor.getSnapshot().status).toBe("done");
    });

    it("should install the next update of the path", async () => {
      await reachUpdateStart({
        osUpdates: [SIMPLE_UPDATE, UPDATE_WITH_FINAL_FIRMWARE],
      });
      await completeDeviceAction(undefined);

      await completeWaitForDeviceReady();
      expect(actor.getSnapshot().value).toBe("InstallOsu");
      expect(latestDeviceActionInput<InstallOsUpdateDAInput>()).toEqual({
        osUpdate: UPDATE_WITH_FINAL_FIRMWARE,
        unlockTimeout: 0,
      });
    });
  });

  describe("flash", () => {
    it("should flash the MCU in update mode when the update asks for it", async () => {
      nextOsVersion(ON_OS, IN_BOOTLOADER);
      await reachUpdateStart({ osUpdates: [UPDATE_WITH_FLASH] });
      await completeDeviceAction(undefined);

      await completeWaitForDeviceReady();

      expect(actor.getSnapshot().value).toBe("FlashMcu");
      expect(latestDeviceActionInput<FlashMcuDAInput>()).toEqual({
        mode: "osUpdate",
        finalFirmware: UPDATE_WITH_FLASH.finalFirmware,
      });
    });

    it("should flash again while the device keeps coming back in bootloader mode", async () => {
      nextOsVersion(ON_OS, IN_BOOTLOADER);
      await reachUpdateStart({ osUpdates: [UPDATE_WITH_FLASH] });
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();

      await completeDeviceAction(flashed("bootloader"));
      expect(sentStateTypes()).not.toContain(ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE);
      await completeWaitForDeviceReady();

      expect(actor.getSnapshot().value).toBe("FlashMcu");
      expect(deviceActionRuns.filter(() => true)).toHaveLength(4);
    });

    it("should report AWAITING_UPDATE_COMPLETE once a flash with no final firmware after it is done", async () => {
      nextOsVersion(ON_OS, IN_BOOTLOADER);
      await reachUpdateStart({ osUpdates: [UPDATE_WITH_FLASH] });
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();

      await completeDeviceAction(flashed(MCU_FLASH_TARGET));

      expect(actor.getSnapshot().value).toBe("WaitForReadyAfterFlash");
      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE);
    });

    it("should not report AWAITING_UPDATE_COMPLETE after a flash followed by a final firmware", async () => {
      nextOsVersion(ON_OS, IN_BOOTLOADER);
      await reachUpdateStart({
        osUpdates: [{ ...UPDATE_WITH_FINAL_FIRMWARE, shouldFlashMcu: true }],
      });
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();

      await completeDeviceAction(flashed(MCU_FLASH_TARGET));

      expect(actor.getSnapshot().value).toBe("WaitForReadyAfterFlash");
      expect(sentStateTypes()).not.toContain(ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE);
    });

    it("should leave the flash loop once the device is back on an OS", async () => {
      nextOsVersion(ON_OS, IN_BOOTLOADER, ON_OS);
      await reachUpdateStart({ osUpdates: [UPDATE_WITH_FLASH] });
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();

      await completeDeviceAction(flashed(MCU_FLASH_TARGET));
      await completeWaitForDeviceReady();
      expect(actor.getSnapshot().status).toBe("done");
    });

    it("should resolve the update path once a recovery flash is over", async () => {
      nextOsVersion(IN_BOOTLOADER, ON_OS);
      await start();

      await completeDeviceAction(flashed(MCU_FLASH_TARGET));
      await completeWaitForDeviceReady();

      expect(actor.getSnapshot().value).toBe("ResolveAfterFlash");
    });

    it("should complete after a recovery flash that leaves nothing to install", async () => {
      nextOsVersion(IN_BOOTLOADER, ON_OS);
      await start();
      await completeDeviceAction(flashed(MCU_FLASH_TARGET));
      await completeWaitForDeviceReady();

      await completeDeviceAction([]);
      expect(actor.getSnapshot().status).toBe("done");
    });

    it("should install the final firmware a recovery flash left pending in OSU mode", async () => {
      nextOsVersion(IN_BOOTLOADER, IN_OSU);
      await start();
      await completeDeviceAction(flashed(MCU_FLASH_TARGET));
      await completeWaitForDeviceReady();

      await completeDeviceAction([UPDATE_WITH_FINAL_FIRMWARE]);

      expect(actor.getSnapshot().value).toBe("InstallFinalFirmware");
      expect(latestDeviceActionInput<InstallOsUpdateDAInput>()).toEqual({
        osUpdate: UPDATE_WITH_FINAL_FIRMWARE,
        unlockTimeout: 0,
      });
    });

    it("should install the next update from its OSU firmware after the pending final firmware", async () => {
      nextOsVersion(IN_BOOTLOADER, IN_OSU, ON_OS);
      await start();
      await completeDeviceAction(flashed(MCU_FLASH_TARGET));
      await completeWaitForDeviceReady();
      await completeDeviceAction([UPDATE_WITH_FINAL_FIRMWARE, SIMPLE_UPDATE]);

      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();

      expect(actor.getSnapshot().value).toBe("InstallOsu");
      expect(latestDeviceActionInput<InstallOsUpdateDAInput>()).toEqual({
        osUpdate: SIMPLE_UPDATE,
        unlockTimeout: 0,
      });
    });

    it("should install the first update of the path from its OSU firmware when the recovery flash leaves the device on an OS", async () => {
      nextOsVersion(IN_BOOTLOADER, ON_OS);
      await start();
      await completeDeviceAction(flashed(MCU_FLASH_TARGET));
      await completeWaitForDeviceReady();

      await completeDeviceAction([UPDATE_WITH_FINAL_FIRMWARE, SIMPLE_UPDATE]);

      expect(actor.getSnapshot().value).toBe("InstallOsu");
      expect(latestDeviceActionInput<InstallOsUpdateDAInput>()).toEqual({
        osUpdate: UPDATE_WITH_FINAL_FIRMWARE,
        unlockTimeout: 0,
      });
    });

    it("should count the first update of the path as the first when the recovery flash leaves the device on an OS", async () => {
      nextOsVersion(IN_BOOTLOADER, ON_OS);
      await start();
      await completeDeviceAction(flashed(MCU_FLASH_TARGET));
      await completeWaitForDeviceReady();
      await completeDeviceAction([UPDATE_WITH_FINAL_FIRMWARE, SIMPLE_UPDATE]);

      await emitPending({
        requiredUserInteraction: UserInteractionRequired.None,
        progress: 0.5,
      });

      const updating = sentStatesOfType(ApplyUpdatesStateType.UPDATING);
      expect(updating[updating.length - 1]).toMatchObject({ updateIndex: 1, updateCount: 2 });
    });

    it("should report AWAITING_UPDATE_COMPLETE once a recovery flash installs the MCU", async () => {
      nextOsVersion(IN_BOOTLOADER);
      await start();

      await completeDeviceAction(flashed(MCU_FLASH_TARGET));

      expect(actor.getSnapshot().value).toBe("WaitForReadyAfterRecoveryFlash");
      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE);
    });

    it("should not report AWAITING_UPDATE_COMPLETE after a recovery flash of the bootloader", async () => {
      nextOsVersion(IN_BOOTLOADER);
      await start();

      await completeDeviceAction(flashed("bootloader"));

      expect(actor.getSnapshot().value).toBe("WaitForReadyAfterRecoveryFlash");
      expect(sentStateTypes()).not.toContain(ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE);
    });

    it("should keep flashing in recovery mode while the device stays in bootloader mode", async () => {
      nextOsVersion(IN_BOOTLOADER);
      await start();

      await completeDeviceAction(flashed("bootloader"));
      await completeWaitForDeviceReady();

      expect(actor.getSnapshot().value).toBe("FlashMcuRecovery");
      expect(latestDeviceActionInput<FlashMcuDAInput>()).toEqual({
        mode: "bootloaderRecovery",
      });
    });
  });

  describe("progress", () => {
    it("should report the progress of the OSU install with the update counters", async () => {
      await reachUpdateStart({
        osUpdates: [SIMPLE_UPDATE, UPDATE_WITH_FINAL_FIRMWARE],
      });

      await emitPending({
        requiredUserInteraction: UserInteractionRequired.None,
        progress: 0.5,
      });

      expect(sentStatesOfType(ApplyUpdatesStateType.UPDATING)).toContainEqual({
        type: ApplyUpdatesStateType.UPDATING,
        progress: expect.any(Number),
        updateIndex: 1,
        updateCount: 2,
      });
    });

    it("should count the second update as the second of the path", async () => {
      await reachUpdateStart({
        osUpdates: [SIMPLE_UPDATE, UPDATE_WITH_FINAL_FIRMWARE],
      });
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.None,
        progress: 0.5,
      });

      const updating = sentStatesOfType(ApplyUpdatesStateType.UPDATING);
      expect(updating[updating.length - 1].updateIndex).toBe(2);
    });

    it("should never move the progress backwards", async () => {
      await reachUpdateStart({
        osUpdates: [SIMPLE_UPDATE, UPDATE_WITH_FINAL_FIRMWARE],
      });

      await emitPending({
        requiredUserInteraction: UserInteractionRequired.None,
        progress: 0.8,
      });
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.None,
        progress: 0.1,
      });

      const progresses = sentStatesOfType(ApplyUpdatesStateType.UPDATING).map(
        state => state.progress,
      );
      expect(progresses).toEqual([...progresses].sort((a, b) => a - b));
    });

    it("should report the same progress only once", async () => {
      await reachUpdateStart();

      await emitPending({
        requiredUserInteraction: UserInteractionRequired.None,
        progress: 0.5,
      });
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.None,
        progress: 0.5,
      });

      const progresses = sentStatesOfType(ApplyUpdatesStateType.UPDATING).map(
        state => state.progress,
      );
      expect(new Set(progresses).size).toBe(progresses.length);
    });

    it("should fill the bar when an update is resumed from OSU mode", async () => {
      getBackup.mockResolvedValue(BACKUP);
      nextOsVersion(IN_OSU, ON_OS);
      await start();

      await completeDeviceAction([{ ...UPDATE_WITH_FINAL_FIRMWARE, shouldFlashMcu: true }]);
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.None,
        progress: 1,
      });
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.None,
        step: RestoreBackupStepValue.UploadCustomLockScreen,
        progress: 1,
      });

      const restoring = sentStatesOfType(ApplyUpdatesStateType.RESTORING);
      expect(restoring[restoring.length - 1].progress).toBeCloseTo(1);
    });

    it("should report the restore progress once the updates are applied", async () => {
      getBackup.mockResolvedValue(BACKUP);
      await reachUpdateStart();
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.None,
        step: RestoreBackupStepValue.InstallOrUpdateApps,
        progress: 0.5,
      });

      expect(sentStatesOfType(ApplyUpdatesStateType.RESTORING)).toContainEqual({
        type: ApplyUpdatesStateType.RESTORING,
        progress: expect.any(Number),
      });
    });
  });

  describe("interactions", () => {
    it("should emit DEVICE_LOCKED while an install waits for an unlock", async () => {
      await reachUpdateStart();

      await emitPending({
        requiredUserInteraction: UserInteractionRequired.UnlockDevice,
      });

      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.DEVICE_LOCKED);
    });

    it("should emit AWAITING_ALLOW_INSTALL_FIRMWARE while an install waits for approval", async () => {
      await reachUpdateStart();

      await emitPending({
        requiredUserInteraction: UserInteractionRequired.AllowInstallFirmware,
      });

      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.AWAITING_ALLOW_INSTALL_FIRMWARE);
    });

    it("should emit AWAITING_GRANT_CONSENT while the restore waits for the user's consent", async () => {
      getBackup.mockResolvedValue(BACKUP);
      await reachUpdateStart();
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.GrantConsent,
        step: RestoreBackupStepValue.RequestMasterConsent,
      });

      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.AWAITING_GRANT_CONSENT);
    });

    it("should emit AWAITING_CONFIRM_LOAD_IMAGE while the restore uploads the lock screen", async () => {
      getBackup.mockResolvedValue(BACKUP);
      await reachUpdateStart();
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.ConfirmLoadImage,
        step: RestoreBackupStepValue.UploadCustomLockScreen,
      });

      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.AWAITING_CONFIRM_LOAD_IMAGE);
    });
  });

  describe("restore", () => {
    it("should restore the backup the device has", async () => {
      getBackup.mockResolvedValue(BACKUP);
      await reachUpdateStart();
      await completeDeviceAction(undefined);

      await completeWaitForDeviceReady();

      expect(getBackup).toHaveBeenCalledWith(DeviceModelId.STAX);
      expect(actor.getSnapshot().value).toBe("RestoreBackup");
    });

    it("should drop the restored backup so a later run does not restore it again", async () => {
      getBackup.mockResolvedValue(BACKUP);
      await reachUpdateStart();
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await completeDeviceAction(RESTORE_RESULT);

      expect(removeBackup).toHaveBeenCalledWith(DeviceModelId.STAX);
      expect(actor.getSnapshot().status).toBe("done");
    });

    it("should report the restore result once the updates are applied", async () => {
      getBackup.mockResolvedValue(BACKUP);
      await reachUpdateStart();
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await completeDeviceAction(RESTORE_RESULT);

      expect(sentStatesOfType(ApplyUpdatesStateType.UPDATES_APPLIED)[0].restoreResult).toBe(
        RESTORE_RESULT,
      );
    });

    it("should report no restore result when the device had no backup", async () => {
      await reachUpdateStart();
      await completeDeviceAction(undefined);

      await completeWaitForDeviceReady();
      expect(
        sentStatesOfType(ApplyUpdatesStateType.UPDATES_APPLIED)[0].restoreResult,
      ).toBeUndefined();
    });

    it("should still complete when dropping the restored backup rejects", async () => {
      getBackup.mockResolvedValue(BACKUP);
      removeBackup.mockRejectedValue(new Error("storage unavailable"));
      await reachUpdateStart();
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await completeDeviceAction(RESTORE_RESULT);

      expect(actor.getSnapshot().status).toBe("done");
      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.UPDATES_APPLIED);
    });

    it("should emit UNEXPECTED_ERROR when reading the backup rejects", async () => {
      getBackup.mockRejectedValue(new Error("storage unavailable"));
      await reachUpdateStart();
      await completeDeviceAction(undefined);

      await completeWaitForDeviceReady();
      expect(restoreChildState()).toBe("UnrecoverableError");
      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.UNEXPECTED_ERROR);
    });

    it("should emit OUT_OF_MEMORY when the device runs out of room reinstalling the apps", async () => {
      getBackup.mockResolvedValue(BACKUP);
      await reachUpdateStart();
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await failDeviceAction(OUT_OF_MEMORY_ERROR);

      expect(restoreChildState()).toBe("OutOfMemory");
      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.OUT_OF_MEMORY);
    });

    it("should send STOP to the parent when cancel is called on the OUT_OF_MEMORY state", async () => {
      getBackup.mockResolvedValue(BACKUP);
      await reachUpdateStart();
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await failDeviceAction(OUT_OF_MEMORY_ERROR);

      sentStatesOfType(ApplyUpdatesStateType.OUT_OF_MEMORY)[0].cancel();
      await settle();

      expect(parentEvents).toContainEqual({
        type: OsUpdatesOrchestratorStateMachineEventType.STOP,
      });
    });

    it("should hand any other restore failure over to CheckErrorCause", async () => {
      getBackup.mockResolvedValue(BACKUP);
      await reachUpdateStart();
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await failDeviceAction(new DeviceLockedError());

      expect(restoreChildState()).toBe("CheckErrorCause");
      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.DEVICE_LOCKED);
    });
  });

  describe("error", () => {
    it("should emit ALLOW_INSTALL_FIRMWARE_REFUSED when the user refuses the install", async () => {
      await reachUpdateStart();
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.AllowInstallFirmware,
      });

      await failDeviceAction(new RefusedByUserDAError());

      expect(actor.getSnapshot().value).toBe("AllowInstallFirmwareRefused");
      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.ALLOW_INSTALL_FIRMWARE_REFUSED);
    });

    it("should hand a failure during the install prompt over to CheckErrorCause", async () => {
      await reachUpdateStart();
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.AllowInstallFirmware,
      });

      await failDeviceAction(new DeviceLockedError());

      expect(actor.getSnapshot().value).toBe("CheckErrorCause");
    });

    it("should hand a failure during the final firmware prompt over to CheckErrorCause", async () => {
      nextOsVersion(ON_OS, IN_OSU);
      await reachUpdateStart({ osUpdates: [UPDATE_WITH_FINAL_FIRMWARE] });
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.AllowInstallFirmware,
      });

      await failDeviceAction(new DeviceLockedError());

      expect(actor.getSnapshot().value).toBe("CheckErrorCause");
    });

    it("should send STOP to the parent when cancel is called after the install was refused", async () => {
      await reachUpdateStart();
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.AllowInstallFirmware,
      });
      await failDeviceAction(new RefusedByUserDAError());

      sentStatesOfType(ApplyUpdatesStateType.ALLOW_INSTALL_FIRMWARE_REFUSED)[0].cancel();
      await settle();

      expect(parentEvents).toContainEqual({
        type: OsUpdatesOrchestratorStateMachineEventType.STOP,
      });
      expect(actor.getSnapshot().value).toBe("Canceled");
    });

    it("should emit ALLOW_SECURE_CONNECTION_REFUSED when the user refuses the secure connection", async () => {
      await reachUpdateStart();
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.AllowSecureConnection,
      });

      await failDeviceAction(new RefusedByUserDAError());

      expect(actor.getSnapshot().value).toBe("AllowSecureConnectionRefused");
      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED);
    });

    it("should install the OSU firmware again when retry is called after a refused secure connection", async () => {
      await reachUpdateStart();
      await emitPending({
        requiredUserInteraction: UserInteractionRequired.AllowSecureConnection,
      });
      await failDeviceAction(new RefusedByUserDAError());

      sentStatesOfType(ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED)[0].retry();
      await settle();

      expect(actor.getSnapshot().value).toBe("InstallOsu");
    });

    it("should read the OS version again once recovered from a failed OS version read", async () => {
      let readFails = true;
      sendCommand.mockImplementation(async ({ command }) => {
        if (!(command instanceof GetOsVersionCommand)) {
          return success(DASHBOARD);
        }
        return readFails
          ? { status: DmkResultStatus.Error, error: new DeviceLockedError() }
          : success(IN_BOOTLOADER);
      });
      await start();

      readFails = false;
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      // Reaching the bootloader branch is only possible through a second OS version read.
      expect(actor.getSnapshot().value).toBe("FlashMcuRecovery");
      expect(sentStateTypes()).toContain(ApplyUpdatesStateType.LOADING);
    });

    it("should install the OSU firmware again once recovered from a failed install", async () => {
      await reachUpdateStart();

      await failDeviceAction(new DeviceLockedError());
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(actor.getSnapshot().value).toBe("InstallOsu");
      expect(sentStateTypes()).toContain(ApplyUpdatesStateType.LOADING);
    });

    it("should emit UNEXPECTED_ERROR when an install fails with an unrecoverable error", async () => {
      await reachUpdateStart();

      sendCommand.mockResolvedValue({
        status: DmkResultStatus.Error,
        error: new UnknownDAError("boom"),
      });
      await failDeviceAction(new UnknownDAError("boom"));
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      expect(actor.getSnapshot().value).toBe("UnrecoverableError");
      expect(lastSentStateType()).toBe(ApplyUpdatesStateType.UNEXPECTED_ERROR);
    });

    it("should send STOP to the parent when cancel is called on the UNEXPECTED_ERROR state", async () => {
      await reachUpdateStart();
      sendCommand.mockResolvedValue({
        status: DmkResultStatus.Error,
        error: new UnknownDAError("boom"),
      });
      await failDeviceAction(new UnknownDAError("boom"));
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      sentStatesOfType(ApplyUpdatesStateType.UNEXPECTED_ERROR)[0].cancel();
      await settle();

      expect(parentEvents).toContainEqual({
        type: OsUpdatesOrchestratorStateMachineEventType.STOP,
      });
      expect(actor.getSnapshot().value).toBe("Canceled");
    });

    it("should give up on a device that never comes back from an install", async () => {
      await reachUpdateStart();
      sendCommand.mockImplementation(async ({ command }) =>
        command instanceof GetOsVersionCommand ? new Promise(() => undefined) : success(DASHBOARD),
      );

      await completeDeviceAction(undefined);
      await jest.advanceTimersByTimeAsync(WAIT_READY_TIMEOUT_MS);

      expect(actor.getSnapshot().value).toBe("CheckErrorCause");
    });

    it("should wait for the device again once it comes back after an install, without installing again", async () => {
      await reachUpdateStart();
      await completeDeviceAction(undefined);

      await expectWaitResumedWithoutAnotherDeviceAction(
        "WaitForReadyAfterOsu",
        WAIT_READY_TIMEOUT_MS,
      );
    });

    it("should wait for the device again once it comes back after the final firmware, without installing again", async () => {
      nextOsVersion(ON_OS, IN_OSU);
      await reachUpdateStart({ osUpdates: [UPDATE_WITH_FINAL_FIRMWARE] });
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await completeDeviceAction(undefined);

      await expectWaitResumedWithoutAnotherDeviceAction(
        "WaitForReadyAfterFinalInstall",
        WAIT_READY_TIMEOUT_MS,
      );
    });

    it("should wait for the device again once it comes back after a flash, without flashing again", async () => {
      nextOsVersion(ON_OS, IN_BOOTLOADER);
      await reachUpdateStart({ osUpdates: [UPDATE_WITH_FLASH] });
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await completeDeviceAction(flashed(MCU_FLASH_TARGET));

      await expectWaitResumedWithoutAnotherDeviceAction(
        "WaitForReadyAfterFlash",
        WAIT_READY_TIMEOUT_AFTER_FLASH_MS,
      );
    });

    it("should wait for the device again once it comes back after a recovery flash, without flashing again", async () => {
      nextOsVersion(IN_BOOTLOADER);
      await start();
      await completeDeviceAction(flashed(MCU_FLASH_TARGET));

      await expectWaitResumedWithoutAnotherDeviceAction(
        "WaitForReadyAfterRecoveryFlash",
        WAIT_READY_TIMEOUT_AFTER_FLASH_MS,
      );
    });

    it("should give up on a device that never comes back from a flash", async () => {
      nextOsVersion(ON_OS, IN_BOOTLOADER);
      await reachUpdateStart({ osUpdates: [UPDATE_WITH_FLASH] });
      await completeDeviceAction(undefined);
      await completeWaitForDeviceReady();
      await completeDeviceAction(flashed(MCU_FLASH_TARGET));
      nextOsVersion(IN_BOOTLOADER);
      sendCommand.mockImplementation(async () => {
        throw new UnknownDAError("link is gone");
      });

      await jest.advanceTimersByTimeAsync(WAIT_READY_TIMEOUT_AFTER_FLASH_MS);
      await settle();

      expect(actor.getSnapshot().value).toBe("CheckErrorCause");
    });
  });
});
