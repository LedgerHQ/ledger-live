import {
  GetOsVersionCommand,
  GoToDashboardDeviceAction,
  isDashboardName,
  isSuccessCommandResult,
  UserInteractionRequired,
  WaitForAppAndVersionDeviceAction,
  type DeviceManagementKit,
  type DeviceSessionId,
  type GetOsVersionResponse,
  type GoToDashboardDAInput,
  type WaitForAppAndVersionDAInput,
} from "@ledgerhq/device-management-kit";
import {
  FlashMcuDeviceAction,
  InstallOsUpdateDeviceAction,
  ResolveOsUpdatePathDeviceAction,
  type FlashMcuDAInput,
  type InstallOsUpdateDAInput,
  type InstallOsUpdateDARequiredInteraction,
  type ResolveOsUpdatePathDAInput,
} from "@ledgerhq/dmk-ledger-wallet";
import { assign, enqueueActions, fromPromise, sendTo, setup } from "xstate";
import { createDeviceActionStateMachine } from "../../../device-action/CreateDeviceActionStateMachine/createDeviceActionStateMachine";
import { ApplyUpdatesStateType, type ApplyUpdatesState } from "../../api/model/ApplyUpdatesState";
import {
  RestoreBackupStateType,
  type RestoreBackupState,
} from "../../api/model/RestoreBackupState";
import {
  OsUpdatesOrchestratorStateMachineEventType,
  type OsUpdatesOrchestratorStateMachineActorRef,
  type OsUpdatesOrchestratorStateMachineEvent,
} from "../orchestrator/types";
import { restoreBackupStateMachine } from "../restore-backup/RestoreBackupStateMachine";
import type { RestoreBackupStateMachineInput } from "../restore-backup/types";
import { checkErrorCauseStateMachine } from "../shared/checkErrorCauseStateMachine";
import { DeviceSituationEventType, isRecovered } from "../shared/types";
import {
  isAllowInstallFirmwareRefusedError,
  isAllowSecureConnectionRefusedError,
} from "../shared/utils/isRefusedByUserError";
import {
  MCU_FLASH_TARGET,
  WAIT_READY_TIMEOUT_AFTER_FLASH_MS,
  WAIT_READY_TIMEOUT_MS,
} from "./constants";
import {
  ApplyUpdatesStateMachineEventType,
  ApplyUpdatesStateMachineLastAction,
  DeviceReadyTarget,
  UpdatePhase,
  type ApplyUpdatesStateMachine,
  type ApplyUpdatesStateMachineContext,
  type ApplyUpdatesStateMachineEvent,
  type ApplyUpdatesStateMachineInput,
} from "./types";
import { fromRestoreBackupState } from "./utils/fromRestoreBackupState";
import { isSameState } from "./utils/isSameState";
import { overallProgress } from "./utils/overallProgress";
import { resumeTarget } from "./utils/resumeTarget";
import { toApplyUpdatesState } from "./utils/toApplyUpdatesState";
import { waitForDeviceReadyStateMachine } from "./waitForDeviceReadyStateMachine";

const currentUpdate = (context: ApplyUpdatesStateMachineContext) =>
  context.osUpdates[context.updateIndex];

const enqueueStateUpdate = (
  enqueue: {
    sendTo: (
      target: OsUpdatesOrchestratorStateMachineActorRef,
      event: OsUpdatesOrchestratorStateMachineEvent,
    ) => void;
    assign: (patch: { lastSentState: ApplyUpdatesState }) => void;
  },
  context: ApplyUpdatesStateMachineContext,
  state: ApplyUpdatesState,
): void => {
  if (context.lastSentState !== null && isSameState(context.lastSentState, state)) {
    return;
  }
  enqueue.sendTo(context.parentRef, {
    type: OsUpdatesOrchestratorStateMachineEventType.STATE_UPDATE,
    state,
  });
  enqueue.assign({ lastSentState: state });
};

/** Where a device action snapshot lands in the context, one entry per part of an update. */
const phasePatch = (
  phase: UpdatePhase,
  progress: number,
): Partial<ApplyUpdatesStateMachineContext> => {
  switch (phase) {
    case UpdatePhase.Osu:
      return { osuProgress: progress };
    case UpdatePhase.Flash:
      return { currentFlashProgress: progress };
    case UpdatePhase.Final:
      return { finalProgress: progress };
    default: {
      const unhandled: never = phase;
      return unhandled;
    }
  }
};

const updatingState = (context: ApplyUpdatesStateMachineContext): ApplyUpdatesState => {
  const updateCount = Math.max(context.osUpdates.length, 1);
  return {
    type: ApplyUpdatesStateType.UPDATING,
    progress: overallProgress(context),
    updateIndex: Math.min(context.updateIndex + 1, updateCount),
    updateCount,
  };
};

export const applyUpdatesStateMachine: ApplyUpdatesStateMachine = setup({
  types: {
    input: {} as ApplyUpdatesStateMachineInput,
    context: {} as ApplyUpdatesStateMachineContext,
    events: {} as ApplyUpdatesStateMachineEvent,
  },
  actors: {
    waitForAppAndVersion: createDeviceActionStateMachine({
      createDeviceAction: (input: WaitForAppAndVersionDAInput) =>
        new WaitForAppAndVersionDeviceAction({ input }),
    }),
    goToDashboard: createDeviceActionStateMachine({
      createDeviceAction: (input: GoToDashboardDAInput) => new GoToDashboardDeviceAction({ input }),
    }),
    getOsVersion: fromPromise(
      async ({
        input,
      }: {
        input: { dmk: DeviceManagementKit; sessionId: DeviceSessionId };
      }): Promise<GetOsVersionResponse> => {
        const result = await input.dmk.sendCommand({
          sessionId: input.sessionId,
          command: new GetOsVersionCommand(),
        });
        if (!isSuccessCommandResult(result)) {
          throw result.error;
        }
        return result.data;
      },
    ),
    // One device action for both installs: it branches internally on whether the device is in OSU
    // mode, which is why the two call sites below hand it the same input.
    installOsUpdate: createDeviceActionStateMachine({
      createDeviceAction: (input: InstallOsUpdateDAInput) =>
        new InstallOsUpdateDeviceAction({ input }),
    }),
    flashMcu: createDeviceActionStateMachine({
      createDeviceAction: (input: FlashMcuDAInput) => new FlashMcuDeviceAction({ input }),
    }),
    resolveOsUpdatePath: createDeviceActionStateMachine({
      createDeviceAction: (input: ResolveOsUpdatePathDAInput) =>
        new ResolveOsUpdatePathDeviceAction({ input }),
    }),
    restoreBackup: restoreBackupStateMachine,
    waitForDeviceReady: waitForDeviceReadyStateMachine,
    checkErrorCause: checkErrorCauseStateMachine,
  },
  actions: {
    sendStateUpdate: enqueueActions(({ context, enqueue }, state: ApplyUpdatesState) => {
      enqueueStateUpdate(enqueue, context, state);
    }),
    /**
     * A device action snapshot either asks something of the user or advances one part of the
     * current update, and the bar has to move on the second without losing the counters on the
     * first, so both go through here.
     */
    reportInstallProgress: enqueueActions(
      (
        { context, enqueue },
        params: {
          phase: UpdatePhase;
          progress: number;
          requiredUserInteraction: InstallOsUpdateDARequiredInteraction | undefined;
        },
      ) => {
        enqueue.assign({
          lastInteraction: params.requiredUserInteraction ?? null,
        });

        switch (params.requiredUserInteraction) {
          case UserInteractionRequired.UnlockDevice:
            enqueueStateUpdate(enqueue, context, { type: ApplyUpdatesStateType.DEVICE_LOCKED });
            return;
          case UserInteractionRequired.AllowSecureConnection:
            enqueueStateUpdate(enqueue, context, {
              type: ApplyUpdatesStateType.AWAITING_ALLOW_SECURE_CONNECTION,
            });
            return;
          case UserInteractionRequired.AllowInstallFirmware:
            enqueueStateUpdate(enqueue, context, {
              type: ApplyUpdatesStateType.AWAITING_ALLOW_INSTALL_FIRMWARE,
            });
            return;
          case UserInteractionRequired.None:
          case undefined:
            break;
          default: {
            const unhandled: never = params.requiredUserInteraction;
            return unhandled;
          }
        }

        const patch = phasePatch(params.phase, params.progress);
        const state = updatingState({ ...context, ...patch });
        enqueue.assign({
          ...patch,
          lastProgress: state.type === ApplyUpdatesStateType.UPDATING ? state.progress : 0,
        });
        enqueueStateUpdate(enqueue, context, state);
      },
    ),
    /** The restore reports on its own scale, and only this machine knows what it is worth here. */
    forwardRestoreState: enqueueActions(({ context, enqueue }, state: RestoreBackupState) => {
      const isRestoring = state.type === RestoreBackupStateType.RESTORING;
      const progress = isRestoring
        ? overallProgress({ ...context, restoreProgress: state.progress })
        : context.lastProgress;

      const forwarded = fromRestoreBackupState(state, progress);
      if (forwarded === null) {
        return;
      }
      if (isRestoring) {
        enqueue.assign({ restoreProgress: state.progress, lastProgress: progress });
      }
      enqueueStateUpdate(enqueue, context, forwarded);
    }),
    sendStop: sendTo(({ context }) => context.parentRef, {
      type: OsUpdatesOrchestratorStateMachineEventType.STOP,
    } as const),
    assignWaitTimedOut: assign({
      error: () => new Error("Timed out waiting for the device to come back"),
    }),
  },
  guards: {
    isBootloader: ({ context }) => context.osVersion?.isBootloader === true,
    isOsu: ({ context }) => context.osVersion?.isOsu === true,
    hasFinalFirmware: ({ context }) => Boolean(currentUpdate(context)?.finalFirmware.firmware),
    shouldFlashMcu: ({ context }) => currentUpdate(context)?.shouldFlashMcu === true,
    hasAnotherUpdate: ({ context }) => context.updateIndex < context.osUpdates.length - 1,
  },
  delays: {
    waitReadyTimeout: WAIT_READY_TIMEOUT_MS,
    waitReadyAfterFlashTimeout: WAIT_READY_TIMEOUT_AFTER_FLASH_MS,
  },
}).createMachine({
  id: "applyUpdates",
  context: ({ input, self }) => ({
    ...input,
    lastSentState: null,
    lastAction: null,
    lastInteraction: null,
    osVersion: null,
    updateIndex: 0,
    osuProgress: 0,
    flashesDone: 0,
    lastFlashTarget: null,
    currentFlashProgress: 0,
    flashCompleted: false,
    finalProgress: 0,
    restoreProgress: 0,
    lastProgress: 0,
    restoreResult: undefined,
    error: null,
    send: self.send,
  }),
  initial: "GetOsVersion",
  on: {
    [DeviceSituationEventType.DEVICE_SITUATION_UPDATE]: {
      actions: {
        type: "sendStateUpdate",
        params: ({ event }) => toApplyUpdatesState(event.situation),
      },
    },
  },
  states: {
    GetOsVersion: {
      entry: assign({ lastAction: ApplyUpdatesStateMachineLastAction.GetOsVersion }),
      invoke: {
        src: "getOsVersion",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
        }),
        onDone: {
          actions: assign({ osVersion: ({ event }) => event.output }),
          target: "CheckOsVersion",
        },
        onError: {
          actions: assign({ error: ({ event }) => event.error }),
          target: "CheckErrorCause",
        },
      },
    },
    CheckOsVersion: {
      always: [
        {
          guard: "isBootloader",
          target: "FlashMcuRecovery",
        },
        {
          guard: "isOsu",
          target: "ResolveAfterOsu",
        },
        {
          target: "WaitingForAppAndVersion",
        },
      ],
    },
    WaitingForAppAndVersion: {
      invoke: {
        src: "waitForAppAndVersion",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
          daInput: { unlockTimeout: context.unlockTimeout ?? 0 },
        }),
        onSnapshot: {
          actions: {
            type: "sendStateUpdate",
            params: ({ event }) => {
              const requiredUserInteraction =
                event.snapshot.context.intermediateValue?.requiredUserInteraction;
              switch (requiredUserInteraction) {
                case UserInteractionRequired.UnlockDevice:
                  return { type: ApplyUpdatesStateType.DEVICE_LOCKED };
                case UserInteractionRequired.None:
                case undefined:
                  return { type: ApplyUpdatesStateType.LOADING };
                default: {
                  const unhandled: never = requiredUserInteraction;
                  return unhandled;
                }
              }
            },
          },
        },
        onDone: [
          {
            guard: ({ event }) => event.output.isLeft(),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "CheckErrorCause",
          },
          {
            guard: ({ event }) =>
              event.output.map(({ name }) => isDashboardName(name)).orDefault(false),
            target: "InstallOsu",
          },
          {
            target: "GoToDashboard",
          },
        ],
      },
    },
    GoToDashboard: {
      invoke: {
        src: "goToDashboard",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
          daInput: { unlockTimeout: context.unlockTimeout ?? 0 },
        }),
        onSnapshot: {
          actions: {
            type: "sendStateUpdate",
            params: ({ event }) => {
              const requiredUserInteraction =
                event.snapshot.context.intermediateValue?.requiredUserInteraction;
              switch (requiredUserInteraction) {
                case UserInteractionRequired.UnlockDevice:
                  return { type: ApplyUpdatesStateType.DEVICE_LOCKED };
                case UserInteractionRequired.None:
                case undefined:
                  return { type: ApplyUpdatesStateType.LOADING };
                default: {
                  const unhandled: never = requiredUserInteraction;
                  return unhandled;
                }
              }
            },
          },
        },
        onDone: [
          {
            guard: ({ event }) => event.output.isLeft(),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "CheckErrorCause",
          },
          {
            target: "WaitingForAppAndVersion",
          },
        ],
      },
    },
    InstallOsu: {
      entry: assign({
        lastAction: ApplyUpdatesStateMachineLastAction.InstallOsu,
      }),
      invoke: {
        src: "installOsUpdate",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
          daInput: {
            osUpdate: currentUpdate(context),
            unlockTimeout: context.unlockTimeout ?? 0,
          },
        }),
        onSnapshot: {
          actions: {
            type: "reportInstallProgress",
            params: ({ event }) => ({
              phase: UpdatePhase.Osu,
              progress: event.snapshot.context.intermediateValue?.progress ?? 0,
              requiredUserInteraction:
                event.snapshot.context.intermediateValue?.requiredUserInteraction,
            }),
          },
        },
        onDone: [
          {
            guard: ({ event, context }) =>
              event.output.isLeft() &&
              context.lastInteraction === UserInteractionRequired.AllowInstallFirmware &&
              isAllowInstallFirmwareRefusedError(event.output.extract()),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "AllowInstallFirmwareRefused",
          },
          {
            guard: ({ event }) =>
              event.output.isLeft() && isAllowSecureConnectionRefusedError(event.output.extract()),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "AllowSecureConnectionRefused",
          },
          {
            guard: ({ event }) => event.output.isLeft(),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "CheckErrorCause",
          },
          {
            actions: assign({ osuProgress: 1 }),
            target: "WaitForReadyAfterOsu",
          },
        ],
      },
    },
    WaitForReadyAfterOsu: {
      entry: [
        assign({ lastAction: ApplyUpdatesStateMachineLastAction.WaitForReadyAfterOsu }),
        enqueueActions(({ enqueue, check }) => {
          if (!check("shouldFlashMcu") && !check("hasFinalFirmware")) {
            enqueue({
              type: "sendStateUpdate",
              params: { type: ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE },
            });
          }
        }),
      ],
      invoke: {
        src: "waitForDeviceReady",
        input: ({ context }) => ({
          dmk: context.dmk,
          connectedDevice: context.connectedDevice,
          // An install can leave the device in bootloader mode, in OSU mode or on the updated OS,
          // and the device action cannot say which, so the first answer decides.
          target: DeviceReadyTarget.AnyResponse,
        }),
        onDone: {
          actions: assign({
            osVersion: ({ event }) => event.output.osVersion,
            connectedDevice: ({ event }) => event.output.connectedDevice,
          }),
          target: "CheckAfterOsuInstall",
        },
        onError: {
          actions: assign({ error: ({ event }) => event.error }),
          target: "CheckErrorCause",
        },
      },
      after: {
        waitReadyTimeout: {
          actions: "assignWaitTimedOut",
          target: "CheckErrorCause",
        },
      },
    },
    CheckAfterOsuInstall: {
      always: [
        {
          guard: "isBootloader",
          target: "FlashMcu",
        },
        {
          target: "CheckFinalFirmware",
        },
      ],
    },
    FlashMcu: {
      entry: assign({
        lastAction: ApplyUpdatesStateMachineLastAction.FlashMcu,
      }),
      invoke: {
        src: "flashMcu",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
          daInput: {
            mode: "osUpdate" as const,
            finalFirmware: currentUpdate(context).finalFirmware,
          },
        }),
        onSnapshot: {
          actions: {
            type: "reportInstallProgress",
            params: ({ event }) => ({
              phase: UpdatePhase.Flash,
              progress: event.snapshot.context.intermediateValue?.progress ?? 0,
              requiredUserInteraction:
                event.snapshot.context.intermediateValue?.requiredUserInteraction,
            }),
          },
        },
        onDone: [
          {
            guard: ({ event }) => event.output.isLeft(),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "CheckErrorCause",
          },
          {
            actions: assign({
              flashesDone: ({ context }) => context.flashesDone + 1,
              currentFlashProgress: 0,
              lastFlashTarget: ({ event }) =>
                event.output.isRight() ? event.output.unsafeCoerce().target : null,
            }),
            target: "WaitForReadyAfterFlash",
          },
        ],
      },
    },
    WaitForReadyAfterFlash: {
      entry: [
        assign({ lastAction: ApplyUpdatesStateMachineLastAction.WaitForReadyAfterFlash }),
        enqueueActions(({ context, enqueue, check }) => {
          if (context.lastFlashTarget === MCU_FLASH_TARGET && !check("hasFinalFirmware")) {
            enqueue({
              type: "sendStateUpdate",
              params: { type: ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE },
            });
          }
        }),
      ],
      invoke: {
        src: "waitForDeviceReady",
        input: ({ context }) => ({
          dmk: context.dmk,
          connectedDevice: context.connectedDevice,
          // A flash can end in bootloader mode with more to flash, or on the updated OS.
          target: DeviceReadyTarget.AnyResponse,
        }),
        onDone: {
          actions: assign({
            osVersion: ({ event }) => event.output.osVersion,
            connectedDevice: ({ event }) => event.output.connectedDevice,
          }),
          target: "CheckAfterFlash",
        },
        onError: {
          actions: assign({ error: ({ event }) => event.error }),
          target: "CheckErrorCause",
        },
      },
      after: {
        waitReadyAfterFlashTimeout: {
          actions: "assignWaitTimedOut",
          target: "CheckErrorCause",
        },
      },
    },
    CheckAfterFlash: {
      always: [
        {
          guard: "isBootloader",
          target: "FlashMcu",
        },
        {
          actions: assign({ flashCompleted: true }),
          target: "CheckFinalFirmware",
        },
      ],
    },
    // Entered when the machine finds the device already in bootloader mode. The update path has not
    // been resolved yet, so there is no final firmware to hand over, which is what the recovery
    // mode is for: it resolves the MCU to flash from the bootloader version alone.
    FlashMcuRecovery: {
      entry: assign({
        lastAction: ApplyUpdatesStateMachineLastAction.FlashMcuRecovery,
      }),
      invoke: {
        src: "flashMcu",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
          daInput: { mode: "bootloaderRecovery" as const },
        }),
        onSnapshot: {
          actions: {
            type: "reportInstallProgress",
            params: ({ event }) => ({
              phase: UpdatePhase.Flash,
              progress: event.snapshot.context.intermediateValue?.progress ?? 0,
              requiredUserInteraction:
                event.snapshot.context.intermediateValue?.requiredUserInteraction,
            }),
          },
        },
        onDone: [
          {
            guard: ({ event }) => event.output.isLeft(),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "CheckErrorCause",
          },
          {
            actions: assign({
              flashesDone: ({ context }) => context.flashesDone + 1,
              currentFlashProgress: 0,
              lastFlashTarget: ({ event }) =>
                event.output.isRight() ? event.output.unsafeCoerce().target : null,
            }),
            target: "WaitForReadyAfterRecoveryFlash",
          },
        ],
      },
    },
    WaitForReadyAfterRecoveryFlash: {
      entry: [
        assign({
          lastAction: ApplyUpdatesStateMachineLastAction.WaitForReadyAfterRecoveryFlash,
        }),
        enqueueActions(({ context, enqueue, check }) => {
          if (context.lastFlashTarget === MCU_FLASH_TARGET && !check("hasFinalFirmware")) {
            enqueue({
              type: "sendStateUpdate",
              params: { type: ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE },
            });
          }
        }),
      ],
      invoke: {
        src: "waitForDeviceReady",
        input: ({ context }) => ({
          dmk: context.dmk,
          connectedDevice: context.connectedDevice,
          target: DeviceReadyTarget.AnyResponse,
        }),
        onDone: {
          actions: assign({
            osVersion: ({ event }) => event.output.osVersion,
            connectedDevice: ({ event }) => event.output.connectedDevice,
          }),
          target: "CheckAfterRecoveryFlash",
        },
        onError: {
          actions: assign({ error: ({ event }) => event.error }),
          target: "CheckErrorCause",
        },
      },
      after: {
        waitReadyAfterFlashTimeout: {
          actions: "assignWaitTimedOut",
          target: "CheckErrorCause",
        },
      },
    },
    CheckAfterRecoveryFlash: {
      always: [
        {
          guard: "isBootloader",
          target: "FlashMcuRecovery",
        },
        {
          actions: assign({ flashCompleted: true }),
          target: "ResolveAfterFlash",
        },
      ],
    },
    // A device sitting in OSU mode has an install under way, so a final firmware is pending by
    // construction and there is nothing to check before installing it.
    ResolveAfterOsu: {
      entry: assign({
        lastAction: ApplyUpdatesStateMachineLastAction.ResolveAfterOsu,
      }),
      invoke: {
        src: "resolveOsUpdatePath",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
          daInput: { unlockTimeout: context.unlockTimeout ?? 0 },
        }),
        onSnapshot: {
          actions: {
            type: "sendStateUpdate",
            params: ({ event }) => {
              const requiredUserInteraction =
                event.snapshot.context.intermediateValue?.requiredUserInteraction;
              switch (requiredUserInteraction) {
                case UserInteractionRequired.UnlockDevice:
                  return { type: ApplyUpdatesStateType.DEVICE_LOCKED };
                case UserInteractionRequired.None:
                case undefined:
                  return { type: ApplyUpdatesStateType.LOADING };
                default: {
                  const unhandled: never = requiredUserInteraction;
                  return unhandled;
                }
              }
            },
          },
        },
        onDone: [
          {
            guard: ({ event }) => event.output.isLeft(),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "CheckErrorCause",
          },
          {
            actions: assign({
              osUpdates: ({ event, context }) =>
                event.output.toMaybe().orDefault(context.osUpdates),
              updateIndex: 0,
              osuProgress: 1,
              flashCompleted: true,
            }),
            target: "InstallFinalFirmware",
          },
        ],
      },
    },
    // A recovery flash can leave the device in OSU mode with a final firmware to install, or back
    // on an OS with nothing under way, which is why this branches on the mode, unlike the OSU one.
    ResolveAfterFlash: {
      entry: assign({
        lastAction: ApplyUpdatesStateMachineLastAction.ResolveAfterFlash,
      }),
      invoke: {
        src: "resolveOsUpdatePath",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
          daInput: { unlockTimeout: context.unlockTimeout ?? 0 },
        }),
        onSnapshot: {
          actions: {
            type: "sendStateUpdate",
            params: ({ event }) => {
              const requiredUserInteraction =
                event.snapshot.context.intermediateValue?.requiredUserInteraction;
              switch (requiredUserInteraction) {
                case UserInteractionRequired.UnlockDevice:
                  return { type: ApplyUpdatesStateType.DEVICE_LOCKED };
                case UserInteractionRequired.None:
                case undefined:
                  return { type: ApplyUpdatesStateType.LOADING };
                default: {
                  const unhandled: never = requiredUserInteraction;
                  return unhandled;
                }
              }
            },
          },
        },
        onDone: [
          {
            guard: ({ event }) => event.output.isLeft(),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "CheckErrorCause",
          },
          // The device came back in OSU mode, so the first update of the path is the one that was
          // under way and only its final firmware is left.
          {
            guard: "isOsu",
            actions: assign({
              osUpdates: ({ event, context }) =>
                event.output.toMaybe().orDefault(context.osUpdates),
              updateIndex: 0,
              osuProgress: 1,
            }),
            target: "CheckFinalFirmware",
          },
          // The device came back on an OS, so the update under way is over and the first update of
          // the path is the next one, to be installed from its OSU firmware.
          {
            actions: assign({
              osUpdates: ({ event, context }) =>
                event.output.toMaybe().orDefault(context.osUpdates),
              updateIndex: 0,
              osuProgress: 0,
            }),
            target: "CheckResolvedUpdates",
          },
        ],
      },
    },
    CheckResolvedUpdates: {
      always: [
        {
          guard: ({ context }) => context.osUpdates.length > 0,
          target: "InstallOsu",
        },
        {
          target: "CheckNextUpdate",
        },
      ],
    },
    CheckFinalFirmware: {
      always: [
        {
          guard: "hasFinalFirmware",
          target: "InstallFinalFirmware",
        },
        {
          target: "CheckNextUpdate",
        },
      ],
    },
    InstallFinalFirmware: {
      entry: assign({
        lastAction: ApplyUpdatesStateMachineLastAction.InstallFinalFirmware,
      }),
      invoke: {
        src: "installOsUpdate",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
          daInput: {
            osUpdate: currentUpdate(context),
            unlockTimeout: context.unlockTimeout ?? 0,
          },
        }),
        onSnapshot: {
          actions: {
            type: "reportInstallProgress",
            params: ({ event }) => ({
              phase: UpdatePhase.Final,
              progress: event.snapshot.context.intermediateValue?.progress ?? 0,
              requiredUserInteraction:
                event.snapshot.context.intermediateValue?.requiredUserInteraction,
            }),
          },
        },
        onDone: [
          {
            guard: ({ event, context }) =>
              event.output.isLeft() &&
              context.lastInteraction === UserInteractionRequired.AllowInstallFirmware &&
              isAllowInstallFirmwareRefusedError(event.output.extract()),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "AllowInstallFirmwareRefused",
          },
          {
            guard: ({ event }) =>
              event.output.isLeft() && isAllowSecureConnectionRefusedError(event.output.extract()),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "AllowSecureConnectionRefused",
          },
          {
            guard: ({ event }) => event.output.isLeft(),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "CheckErrorCause",
          },
          {
            actions: assign({ finalProgress: 1 }),
            target: "WaitForReadyAfterFinalInstall",
          },
        ],
      },
    },
    WaitForReadyAfterFinalInstall: {
      entry: [
        assign({ lastAction: ApplyUpdatesStateMachineLastAction.WaitForReadyAfterFinalInstall }),
        {
          type: "sendStateUpdate",
          params: { type: ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE },
        },
      ],
      invoke: {
        src: "waitForDeviceReady",
        input: ({ context }) => ({
          dmk: context.dmk,
          connectedDevice: context.connectedDevice,
          target: DeviceReadyTarget.UpdatedOs,
        }),
        onDone: {
          actions: assign({
            osVersion: ({ event }) => event.output.osVersion,
            connectedDevice: ({ event }) => event.output.connectedDevice,
          }),
          target: "CheckNextUpdate",
        },
        onError: {
          actions: assign({ error: ({ event }) => event.error }),
          target: "CheckErrorCause",
        },
      },
      after: {
        waitReadyTimeout: {
          actions: "assignWaitTimedOut",
          target: "CheckErrorCause",
        },
      },
    },
    CheckNextUpdate: {
      always: [
        {
          guard: "hasAnotherUpdate",
          actions: assign({
            updateIndex: ({ context }) => context.updateIndex + 1,
            osuProgress: 0,
            flashesDone: 0,
            lastFlashTarget: null,
            currentFlashProgress: 0,
            flashCompleted: false,
            finalProgress: 0,
          }),
          target: "InstallOsu",
        },
        {
          target: "RestoreBackup",
        },
      ],
    },
    // The same step the orchestrator runs on its own when there is nothing to update, which is
    // why it reports on its own scale and its states are scaled back into the bar on the way out.
    // It reports to this machine as it would to the orchestrator, so its events are only ever
    // handled here, where that child is the one thing that can have sent them.
    RestoreBackup: {
      on: {
        [OsUpdatesOrchestratorStateMachineEventType.STATE_UPDATE]: {
          actions: {
            type: "forwardRestoreState",
            params: ({ event }) => event.state as RestoreBackupState,
          },
        },
        [OsUpdatesOrchestratorStateMachineEventType.STOP]: "Canceled",
      },
      invoke: {
        id: "restoreBackup",
        src: "restoreBackup",
        input: ({ context, self }): RestoreBackupStateMachineInput => ({
          dmk: context.dmk,
          connectedDevice: context.connectedDevice,
          storage: context.storage,
          unlockTimeout: context.unlockTimeout,
          parentRef: self,
        }),
        onDone: {
          actions: assign({
            restoreResult: ({ event }) => event.output.restoreResult,
            restoreProgress: 1,
          }),
          target: "UpdatesApplied",
        },
        onError: {
          actions: assign({ error: ({ event }) => event.error }),
          target: "UnrecoverableError",
        },
      },
    },
    AllowSecureConnectionRefused: {
      entry: {
        type: "sendStateUpdate",
        params: ({ context }) => ({
          type: ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED,
          retry: () => context.send({ type: ApplyUpdatesStateMachineEventType.RETRY }),
          cancel: () => context.send({ type: ApplyUpdatesStateMachineEventType.CANCEL }),
        }),
      },
      on: {
        [ApplyUpdatesStateMachineEventType.RETRY]: "ResumeLastAction",
        [ApplyUpdatesStateMachineEventType.CANCEL]: "Canceled",
      },
    },
    // Refusing the install aborts it, so there is nothing to retry.
    AllowInstallFirmwareRefused: {
      entry: {
        type: "sendStateUpdate",
        params: ({ context }) => ({
          type: ApplyUpdatesStateType.ALLOW_INSTALL_FIRMWARE_REFUSED,
          cancel: () => context.send({ type: ApplyUpdatesStateMachineEventType.CANCEL }),
        }),
      },
      on: {
        [ApplyUpdatesStateMachineEventType.CANCEL]: "Canceled",
      },
    },
    CheckErrorCause: {
      invoke: {
        src: "checkErrorCause",
        input: ({ context, self }) => ({
          dmk: context.dmk,
          connectedDevice: context.connectedDevice,
          error: context.error,
          hostRef: self,
        }),
        onDone: [
          {
            guard: ({ event }) => isRecovered(event.output),
            actions: assign({
              connectedDevice: ({ context, event }) =>
                isRecovered(event.output) ? event.output.connectedDevice : context.connectedDevice,
            }),
            target: "ResumeLastAction",
          },
          {
            target: "UnrecoverableError",
          },
        ],
        onError: {
          target: "UnrecoverableError",
        },
      },
    },
    ResumeLastAction: {
      entry: {
        type: "sendStateUpdate",
        params: { type: ApplyUpdatesStateType.LOADING },
      },
      always: Object.entries(resumeTarget).map(([lastAction, target]) => ({
        guard: ({ context }: { context: ApplyUpdatesStateMachineContext }) =>
          context.lastAction === lastAction,
        target,
      })),
    },
    UnrecoverableError: {
      entry: {
        type: "sendStateUpdate",
        params: ({ context }) => ({
          type: ApplyUpdatesStateType.UNEXPECTED_ERROR,
          cancel: () => context.send({ type: ApplyUpdatesStateMachineEventType.CANCEL }),
        }),
      },
      on: {
        [ApplyUpdatesStateMachineEventType.CANCEL]: "Canceled",
      },
    },
    Canceled: {
      entry: "sendStop",
    },
    UpdatesApplied: {
      entry: {
        type: "sendStateUpdate",
        params: ({ context }) => ({
          type: ApplyUpdatesStateType.UPDATES_APPLIED,
          restoreResult: context.restoreResult,
        }),
      },
      type: "final",
    },
  },
});
