import { UserInteractionRequired, type DeviceId } from "@ledgerhq/device-management-kit";
import {
  CreateBackupDeviceAction,
  type Backup,
  type CreateBackupDAInput,
} from "@ledgerhq/dmk-ledger-wallet";
import { assign, enqueueActions, fromPromise, sendTo, setup } from "xstate";
import { createDeviceActionStateMachine } from "../../../device-action/CreateDeviceActionStateMachine/createDeviceActionStateMachine";
import { CreateBackupStateType, type CreateBackupState } from "../../api/model/CreateBackupState";
import type { DeviceBackupStorage } from "../../api/model/DeviceBackupStorage";
import { OsUpdatesOrchestratorStateMachineEventType } from "../orchestrator/types";
import { checkErrorCauseStateMachine } from "../shared/checkErrorCauseStateMachine";
import { CheckErrorCauseResult, DeviceSituationEventType } from "../shared/types";
import { BACKUP_MAX_AGE_MS } from "./constants";
import {
  CreateBackupStateMachineEventType,
  CreateBackupStateMachineLastAction,
  type CreateBackupStateMachineContext,
  type CreateBackupStateMachineEvent,
  type CreateBackupStateMachineInput,
} from "./types";
import { isAllowSecureConnectionRefusedError } from "./utils/isAllowSecureConnectionRefusedError";
import { isSameState } from "./utils/isSameState";
import { resumeTarget } from "./utils/resumeTarget";
import { toCreateBackupState } from "./utils/toCreateBackupState";

export const createBackupStateMachine = setup({
  types: {
    input: {} as CreateBackupStateMachineInput,
    context: {} as CreateBackupStateMachineContext,
    events: {} as CreateBackupStateMachineEvent,
  },
  actors: {
    getBackup: fromPromise(
      async ({
        input,
      }: {
        input: { storage: DeviceBackupStorage; deviceId: DeviceId };
      }): Promise<Backup | undefined> => {
        return input.storage.getBackup(input.deviceId);
      },
    ),
    createBackup: createDeviceActionStateMachine({
      createDeviceAction: (input: CreateBackupDAInput) => new CreateBackupDeviceAction({ input }),
    }),
    saveBackup: fromPromise(
      async ({
        input,
      }: {
        input: { storage: DeviceBackupStorage; deviceId: DeviceId; backup: Backup };
      }): Promise<void> => {
        return input.storage.saveBackup(input.deviceId, input.backup);
      },
    ),
    checkErrorCause: checkErrorCauseStateMachine,
  },
  actions: {
    sendStateUpdate: enqueueActions(({ context, enqueue }, state: CreateBackupState) => {
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
  guards: {
    hasExistingBackup: ({ context }) => context.existingBackup !== undefined,
    hasFreshBackup: ({ context }) =>
      context.existingBackup !== undefined &&
      Date.now() - context.existingBackup.createdAt.getTime() < BACKUP_MAX_AGE_MS,
  },
}).createMachine({
  id: "createBackup",
  context: ({ input, self }) => ({
    ...input,
    lastSentState: null,
    lastAction: null,
    existingBackup: undefined,
    backup: null,
    error: null,
    send: self.send,
  }),
  initial: "GetExistingBackup",
  on: {
    [DeviceSituationEventType.DEVICE_SITUATION_UPDATE]: {
      actions: {
        type: "sendStateUpdate",
        params: ({ event }) => toCreateBackupState(event.situation),
      },
    },
  },
  states: {
    GetExistingBackup: {
      invoke: {
        src: "getBackup",
        input: ({ context }) => ({
          storage: context.storage,
          deviceId: context.connectedDevice.id,
        }),
        onDone: {
          actions: assign({ existingBackup: ({ event }) => event.output }),
          target: "CheckExistingBackup",
        },
        onError: {
          actions: assign({ error: ({ event }) => event.error }),
          target: "UnrecoverableError",
        },
      },
    },
    CheckExistingBackup: {
      always: [
        // A backup taken moments ago still reflects the device, so reuse it without asking.
        {
          guard: "hasFreshBackup",
          target: "Done",
        },
        {
          guard: "hasExistingBackup",
          target: "AwaitingBackupSelection",
        },
        {
          target: "CreateBackup",
        },
      ],
    },
    AwaitingBackupSelection: {
      entry: {
        type: "sendStateUpdate",
        params: ({ context }) => ({
          type: CreateBackupStateType.AWAITING_BACKUP_SELECTION,
          useExistingBackup: () =>
            context.send({ type: CreateBackupStateMachineEventType.USE_EXISTING_BACKUP }),
          createNewBackup: () =>
            context.send({ type: CreateBackupStateMachineEventType.CREATE_NEW_BACKUP }),
        }),
      },
      on: {
        [CreateBackupStateMachineEventType.USE_EXISTING_BACKUP]: "Done",
        [CreateBackupStateMachineEventType.CREATE_NEW_BACKUP]: "CreateBackup",
      },
    },
    CreateBackup: {
      entry: assign({ lastAction: CreateBackupStateMachineLastAction.CreateBackup }),
      invoke: {
        src: "createBackup",
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
                  return { type: CreateBackupStateType.DEVICE_LOCKED };
                case UserInteractionRequired.AllowSecureConnection:
                  return { type: CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION };
                case UserInteractionRequired.None:
                case undefined:
                  return { type: CreateBackupStateType.LOADING };
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
            actions: assign({ backup: ({ event }) => event.output.toMaybe().extractNullable() }),
            target: "SaveBackup",
          },
        ],
      },
    },
    SaveBackup: {
      entry: {
        type: "sendStateUpdate",
        params: { type: CreateBackupStateType.LOADING },
      },
      invoke: {
        src: "saveBackup",
        input: ({ context }) => ({
          storage: context.storage,
          deviceId: context.connectedDevice.id,
          backup: context.backup!,
        }),
        onDone: {
          target: "Done",
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
          type: CreateBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED,
          retry: () => context.send({ type: CreateBackupStateMachineEventType.RETRY }),
          cancel: () => context.send({ type: CreateBackupStateMachineEventType.CANCEL }),
        }),
      },
      on: {
        [CreateBackupStateMachineEventType.RETRY]: "CreateBackup",
        [CreateBackupStateMachineEventType.CANCEL]: "Canceled",
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
            guard: ({ event }) => event.output === CheckErrorCauseResult.Recovered,
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
        params: { type: CreateBackupStateType.LOADING },
      },
      always: Object.entries(resumeTarget).map(([lastAction, target]) => ({
        guard: ({ context }: { context: CreateBackupStateMachineContext }) =>
          context.lastAction === lastAction,
        target,
      })),
    },
    UnrecoverableError: {
      entry: {
        type: "sendStateUpdate",
        params: ({ context }) => ({
          type: CreateBackupStateType.UNEXPECTED_ERROR,
          cancel: () => context.send({ type: CreateBackupStateMachineEventType.CANCEL }),
        }),
      },
      on: {
        [CreateBackupStateMachineEventType.CANCEL]: "Canceled",
      },
    },
    Canceled: {
      entry: "sendStop",
    },
    Done: {
      type: "final",
    },
  },
});
