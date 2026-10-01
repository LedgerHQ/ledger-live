import type {
  ConnectedDevice,
  DeviceManagementKit,
  DiscoveredDevice,
  GetOsVersionResponse,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import type { FlashTarget, OsUpdate, RestoreBackupDAOutput } from "@ledgerhq/dmk-ledger-wallet";
import type { StateMachine, StateSchema } from "xstate";
import type { ApplyUpdatesState } from "../../api/model/ApplyUpdatesState";
import type { DeviceBackupStorage } from "../../api/model/DeviceBackupStorage";
import type {
  OsUpdatesOrchestratorStateMachineActorRef,
  OsUpdatesOrchestratorStateMachineEvent,
} from "../orchestrator/types";
import type { DeviceSituationEvent } from "../shared/types";

export type ApplyUpdatesStateMachineInput = {
  dmk: DeviceManagementKit;
  connectedDevice: ConnectedDevice;
  osUpdates: OsUpdate[];
  storage: DeviceBackupStorage;
  parentRef: OsUpdatesOrchestratorStateMachineActorRef;
  unlockTimeout?: number;
};

export type ApplyUpdatesStateMachineContext = ApplyUpdatesStateMachineInput & {
  lastSentState: ApplyUpdatesState | null;
  lastAction: ApplyUpdatesStateMachineLastAction | null;
  lastInteraction: UserInteractionRequired | null;
  osVersion: GetOsVersionResponse | null;
  /** 0-based, the API exposes it 1-based. */
  updateIndex: number;
  osuProgress: number;
  flashesDone: number;
  /** Set by the flash that just finished. `MCU_FLASH_TARGET` is the last pass of the loop. */
  lastFlashTarget: FlashTarget | null;
  currentFlashProgress: number;
  /** The flash loop has no known length, so its term only completes when the loop is left. */
  flashCompleted: boolean;
  finalProgress: number;
  /** Mirrors what the restore step reports, on its own 0 to 1 scale. */
  restoreProgress: number;
  /** Keeps the bar monotonic across states that recompute it from different terms. */
  lastProgress: number;
  restoreResult: RestoreBackupDAOutput | undefined;
  error: unknown;
  send: (params: ApplyUpdatesStateMachineEvent) => void;
};

export enum ApplyUpdatesStateMachineEventType {
  CANCEL = "CANCEL",
  RETRY = "RETRY",
}

export type ApplyUpdatesStateMachineEvent =
  | {
      type: ApplyUpdatesStateMachineEventType.CANCEL;
    }
  | {
      type: ApplyUpdatesStateMachineEventType.RETRY;
    }
  | DeviceSituationEvent
  /**
   * The restore step reports in the orchestrator's terms, and this machine stands in for the
   * orchestrator while the step is the last tenth of a run.
   */
  | OsUpdatesOrchestratorStateMachineEvent;

export enum ApplyUpdatesStateMachineLastAction {
  GetOsVersion = "getOsVersion",
  InstallOsu = "installOsu",
  FlashMcu = "flashMcu",
  FlashMcuRecovery = "flashMcuRecovery",
  ResolveAfterOsu = "resolveAfterOsu",
  ResolveAfterFlash = "resolveAfterFlash",
  InstallFinalFirmware = "installFinalFirmware",
  WaitForReadyAfterOsu = "waitForReadyAfterOsu",
  WaitForReadyAfterFlash = "waitForReadyAfterFlash",
  WaitForReadyAfterRecoveryFlash = "waitForReadyAfterRecoveryFlash",
  WaitForReadyAfterFinalInstall = "waitForReadyAfterFinalInstall",
}

export type ApplyUpdatesStateMachine = StateMachine<
  ApplyUpdatesStateMachineContext,
  ApplyUpdatesStateMachineEvent,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  any, // children
  any, // actor
  any, // action
  any, // guard
  any, // delay
  any, // state value
  any, // tag
  /* eslint-enable @typescript-eslint/no-explicit-any */
  ApplyUpdatesStateMachineInput,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  any, // output
  any, // emitted
  any, // meta
  /* eslint-enable @typescript-eslint/no-explicit-any */
  StateSchema
>;

export enum UpdatePhase {
  Osu = "osu",
  Flash = "flash",
  Final = "final",
}

/** What the device must report for a reboot to count as done, one per `waitForDeviceReady` site. */
export enum DeviceReadyTarget {
  /** Flashing is next, the device must come back in bootloader mode. */
  Bootloader = "bootloader",
  /** A final firmware is pending, the device must come back running the OS updater. */
  Osu = "osu",
  /** Mid flash loop, any answer is enough and the caller branches on `isBootloader`. */
  AnyResponse = "anyResponse",
  /** The install is over, the device must be back on a regular OS. */
  UpdatedOs = "updatedOs",
}

export type WaitForDeviceReadyInput = {
  dmk: DeviceManagementKit;
  connectedDevice: ConnectedDevice;
  target: DeviceReadyTarget;
};

export type WaitForDeviceReadyContext = WaitForDeviceReadyInput & {
  osVersion: GetOsVersionResponse | null;
  rediscoveredDevice: DiscoveredDevice | null;
};

export enum WaitForDeviceReadyEventType {
  DEVICE_FOUND = "DEVICE_FOUND",
}

export type WaitForDeviceReadyEvent = {
  type: WaitForDeviceReadyEventType.DEVICE_FOUND;
  device: DiscoveredDevice;
};

export type WaitForDeviceReadyOutput = {
  osVersion: GetOsVersionResponse;
  /** The device that answered, which is not the one passed in when BLE privacy changed its id. */
  connectedDevice: ConnectedDevice;
};

export type WaitForDeviceReadyStateMachine = StateMachine<
  WaitForDeviceReadyContext,
  WaitForDeviceReadyEvent,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  any, // children
  any, // actor
  any, // action
  any, // guard
  any, // delay
  any, // state value
  any, // tag
  /* eslint-enable @typescript-eslint/no-explicit-any */
  WaitForDeviceReadyInput,
  WaitForDeviceReadyOutput,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  any, // emitted
  any, // meta
  /* eslint-enable @typescript-eslint/no-explicit-any */
  StateSchema
>;
