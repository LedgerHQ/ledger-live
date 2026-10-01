import { UserInteractionRequired, type DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  RestoreBackupDeviceAction,
  type Backup,
  type RestoreBackupDAInput,
} from "@ledgerhq/dmk-ledger-wallet";
import { assign, enqueueActions, fromPromise, sendTo, setup } from "xstate";
import { createDeviceActionStateMachine } from "../../../device-action/CreateDeviceActionStateMachine/createDeviceActionStateMachine";
import type { DeviceBackupStorage } from "../../api/model/DeviceBackupStorage";
import {
  RestoreBackupStateType,
  type RestoreBackupState,
} from "../../api/model/RestoreBackupState";
import { OsUpdatesOrchestratorStateMachineEventType } from "../orchestrator/types";
import { checkErrorCauseStateMachine } from "../shared/checkErrorCauseStateMachine";
import { DeviceSituationEventType, isRecovered } from "../shared/types";
import { isAllowSecureConnectionRefusedError } from "../shared/utils/isRefusedByUserError";
import { isOutOfMemoryError } from "../shared/utils/isOutOfMemoryError";
import {
  RestoreBackupStateMachineEventType,
  type RestoreBackupStateMachine,
  type RestoreBackupStateMachineContext,
  type RestoreBackupStateMachineEvent,
  type RestoreBackupStateMachineInput,
  type RestoreBackupStateMachineOutput,
} from "./types";
import { hasAnythingToRestore } from "./utils/hasAnythingToRestore";
import { isSameState } from "./utils/isSameState";
import { restoreProgress } from "./utils/restoreProgress";
import { toRestoreBackupState } from "./utils/toRestoreBackupState";

export const restoreBackupStateMachine: RestoreBackupStateMachine = setup({
  types: {
    input: {} as RestoreBackupStateMachineInput,
    context: {} as RestoreBackupStateMachineContext,
    events: {} as RestoreBackupStateMachineEvent,
    output: {} as RestoreBackupStateMachineOutput,
  },
  actors: {
    getBackup: fromPromise(
      async ({
        input,
      }: {
        input: { storage: DeviceBackupStorage; deviceModelId: DeviceModelId };
      }): Promise<Backup | undefined> => {
        return input.storage.getBackup(input.deviceModelId);
      },
    ),
    restoreBackup: createDeviceActionStateMachine({
      createDeviceAction: (input: RestoreBackupDAInput) => new RestoreBackupDeviceAction({ input }),
    }),
    removeBackup: fromPromise(
      async ({
        input,
      }: {
        input: { storage: DeviceBackupStorage; deviceModelId: DeviceModelId };
      }): Promise<void> => {
        return input.storage.removeBackup(input.deviceModelId);
      },
    ),
    checkErrorCause: checkErrorCauseStateMachine,
  },
  actions: {
    sendStateUpdate: enqueueActions(({ context, enqueue }, state: RestoreBackupState) => {
      if (context.lastSentState !== null && isSameState(context.lastSentState, state)) {
        return;
      }
      enqueue.sendTo(context.parentRef, {
        type: OsUpdatesOrchestratorStateMachineEventType.STATE_UPDATE,
        state,
      });
      enqueue.assign({ lastSentState: state });
    }),
    sendStop: sendTo(({ context }) => context.parentRef, {
      type: OsUpdatesOrchestratorStateMachineEventType.STOP,
    } as const),
  },
}).createMachine({
  id: "restoreBackup",
  context: ({ input, self }) => ({
    ...input,
    lastSentState: null,
    backup: undefined,
    restoreResult: undefined,
    error: null,
    send: self.send,
  }),
  initial: "GetBackup",
  on: {
    [DeviceSituationEventType.DEVICE_SITUATION_UPDATE]: {
      actions: {
        type: "sendStateUpdate",
        params: ({ event }) => toRestoreBackupState(event.situation),
      },
    },
  },
  states: {
    GetBackup: {
      entry: {
        type: "sendStateUpdate",
        params: { type: RestoreBackupStateType.LOADING },
      },
      invoke: {
        src: "getBackup",
        input: ({ context }) => ({
          storage: context.storage,
          deviceModelId: context.connectedDevice.modelId,
        }),
        onDone: [
          {
            guard: ({ event }) => hasAnythingToRestore(event.output),
            actions: assign({ backup: ({ event }) => event.output }),
            target: "RestoreBackup",
          },
          {
            target: "RemoveBackup",
          },
        ],
        onError: {
          actions: assign({ error: ({ event }) => event.error }),
          target: "UnrecoverableError",
        },
      },
    },
    RestoreBackup: {
      invoke: {
        src: "restoreBackup",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
          daInput: {
            backup: context.backup!,
            unlockTimeout: context.unlockTimeout ?? 0,
          },
        }),
        onSnapshot: {
          actions: {
            type: "sendStateUpdate",
            params: ({ event }) => {
              const { intermediateValue } = event.snapshot.context;
              const requiredUserInteraction = intermediateValue?.requiredUserInteraction;
              switch (requiredUserInteraction) {
                case UserInteractionRequired.UnlockDevice:
                  return { type: RestoreBackupStateType.DEVICE_LOCKED };
                case UserInteractionRequired.AllowSecureConnection:
                  return { type: RestoreBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION };
                case UserInteractionRequired.GrantConsent:
                  return { type: RestoreBackupStateType.AWAITING_GRANT_CONSENT };
                case UserInteractionRequired.AllowListApps:
                  return { type: RestoreBackupStateType.AWAITING_ALLOW_LIST_APPS };
                case UserInteractionRequired.ConfirmLoadImage:
                  return { type: RestoreBackupStateType.AWAITING_CONFIRM_LOAD_IMAGE };
                case UserInteractionRequired.ConfirmCommitImage:
                  return { type: RestoreBackupStateType.AWAITING_CONFIRM_COMMIT_IMAGE };
                // Nothing being asked of the user, so the snapshot is only moving the bar.
                case UserInteractionRequired.None:
                case undefined:
                  return {
                    type: RestoreBackupStateType.RESTORING,
                    progress: restoreProgress(intermediateValue),
                  };
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
            guard: ({ event }) =>
              event.output.isLeft() && isOutOfMemoryError(event.output.extract()),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "OutOfMemory",
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
            actions: assign({
              restoreResult: ({ event }) => event.output.toMaybe().extract(),
            }),
            target: "RemoveBackup",
          },
        ],
      },
    },
    RemoveBackup: {
      invoke: {
        src: "removeBackup",
        input: ({ context }) => ({
          storage: context.storage,
          deviceModelId: context.connectedDevice.modelId,
        }),
        onDone: {
          target: "BackupRestored",
        },
        onError: {
          target: "BackupRestored",
        },
      },
    },
    AllowSecureConnectionRefused: {
      entry: {
        type: "sendStateUpdate",
        params: ({ context }) => ({
          type: RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED,
          retry: () => context.send({ type: RestoreBackupStateMachineEventType.RETRY }),
          cancel: () => context.send({ type: RestoreBackupStateMachineEventType.CANCEL }),
        }),
      },
      on: {
        [RestoreBackupStateMachineEventType.RETRY]: "RestoreBackup",
        [RestoreBackupStateMachineEventType.CANCEL]: "Canceled",
      },
    },
    OutOfMemory: {
      entry: {
        type: "sendStateUpdate",
        params: ({ context }) => ({
          type: RestoreBackupStateType.OUT_OF_MEMORY,
          cancel: () => context.send({ type: RestoreBackupStateMachineEventType.CANCEL }),
        }),
      },
      on: {
        [RestoreBackupStateMachineEventType.CANCEL]: "Canceled",
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
            target: "RestoreBackup",
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
    UnrecoverableError: {
      entry: {
        type: "sendStateUpdate",
        params: ({ context }) => ({
          type: RestoreBackupStateType.UNEXPECTED_ERROR,
          cancel: () => context.send({ type: RestoreBackupStateMachineEventType.CANCEL }),
        }),
      },
      on: {
        [RestoreBackupStateMachineEventType.CANCEL]: "Canceled",
      },
    },
    Canceled: {
      entry: "sendStop",
    },
    BackupRestored: {
      entry: {
        type: "sendStateUpdate",
        params: ({ context }) => ({
          type: RestoreBackupStateType.BACKUP_RESTORED,
          restoreResult: context.restoreResult,
        }),
      },
      type: "final",
    },
  },
  output: ({ context }) => ({ restoreResult: context.restoreResult }),
});
