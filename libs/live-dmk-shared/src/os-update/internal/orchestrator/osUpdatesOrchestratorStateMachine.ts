import { assign, enqueueActions, setup } from "xstate";
import { OsUpdatesSteps } from "../../api/model/OsUpdatesSteps";
import { createBackupStateMachine } from "../create-backup/CreateBackupStateMachine";
import type { CreateBackupStateMachineInput } from "../create-backup/types";
import { preChecksStateMachine } from "../pre-checks/PreChecksStateMachine";
import { PreChecksNextAction, type PreChecksStateMachineInput } from "../pre-checks/types";
import {
  OsUpdatesOrchestratorStateMachineContext,
  OsUpdatesOrchestratorStateMachineEventType,
  OsUpdatesOrchestratorStateMachineInput,
  type OsUpdatesOrchestratorStateMachineEvent,
} from "./types";
import { stepLoadingState } from "./utils/stepLoadingState";
import { unexpectedErrorState } from "./utils/unexpectedErrorState";

const INITIAL_STEP = OsUpdatesSteps.PRE_CHECKS;

export const osUpdatesOrchestratorStateMachine = setup({
  types: {
    input: {} as OsUpdatesOrchestratorStateMachineInput,
    context: {} as OsUpdatesOrchestratorStateMachineContext,
    events: {} as OsUpdatesOrchestratorStateMachineEvent,
    output: {} as unknown as void,
  },
  actors: {
    preChecks: preChecksStateMachine,
    createBackup: createBackupStateMachine,
  },
  actions: {
    enterStep: assign({
      currentStep: (_, step: OsUpdatesSteps) => step,
      currentState: (_, step: OsUpdatesSteps) => stepLoadingState(step),
    }),
    stopChildren: enqueueActions(({ enqueue }) => {
      enqueue.stopChild("preChecks");
      enqueue.stopChild("createBackup");
    }),
    callOnStop: ({ context }) => {
      context.onStop();
    },
    assignStateUpdate: assign({
      currentState: ({ event, context }) => {
        if (event.type !== OsUpdatesOrchestratorStateMachineEventType.STATE_UPDATE) {
          return context.currentState;
        }
        return event.state;
      },
    }),
    assignUnexpectedError: assign({
      currentState: ({ context, self }) =>
        unexpectedErrorState(context.currentStep, () =>
          self.send({ type: OsUpdatesOrchestratorStateMachineEventType.STOP }),
        ),
    }),
  },
}).createMachine({
  id: "osUpdatesOrchestrator",
  context: ({ input }) => ({
    ...input,
    currentStep: INITIAL_STEP,
    currentState: stepLoadingState(INITIAL_STEP),
  }),
  initial: "PreChecks",
  on: {
    [OsUpdatesOrchestratorStateMachineEventType.STATE_UPDATE]: {
      actions: "assignStateUpdate",
    },
    [OsUpdatesOrchestratorStateMachineEventType.STOP]: {
      target: ".Stopped",
      actions: ["stopChildren", "callOnStop"],
    },
  },
  states: {
    PreChecks: {
      entry: { type: "enterStep", params: OsUpdatesSteps.PRE_CHECKS },
      invoke: {
        id: "preChecks",
        src: "preChecks",
        input: ({ context, self }): PreChecksStateMachineInput => ({
          dmk: context.dmk,
          connectedDevice: context.connectedDevice,
          osUpdates: context.osUpdates,
          storage: context.storage,
          unlockTimeout: context.unlockTimeout,
          parentRef: self,
        }),
        onDone: [
          {
            guard: ({ event }) => event.output === PreChecksNextAction.CreateBackup,
            target: "CreateBackup",
          },
          {
            target: "Done",
          },
        ],
        onError: {
          target: "Failed",
        },
      },
    },
    CreateBackup: {
      entry: { type: "enterStep", params: OsUpdatesSteps.CREATE_BACKUP },
      invoke: {
        id: "createBackup",
        src: "createBackup",
        input: ({ context, self }): CreateBackupStateMachineInput => ({
          dmk: context.dmk,
          connectedDevice: context.connectedDevice,
          storage: context.storage,
          unlockTimeout: context.unlockTimeout,
          parentRef: self,
        }),
        onDone: {
          target: "Done",
        },
        onError: {
          target: "Failed",
        },
      },
    },
    Failed: {
      entry: "assignUnexpectedError",
    },
    Done: {
      type: "final",
    },
    Stopped: {
      type: "final",
    },
  },
});
