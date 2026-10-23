import { log } from "@ledgerhq/logs";
import { assign, enqueueActions, setup } from "xstate";
import { OsUpdatesSteps } from "../../api/model/OsUpdatesSteps";
import { applyUpdatesStateMachine } from "../apply-updates/ApplyUpdatesStateMachine";
import type { ApplyUpdatesStateMachineInput } from "../apply-updates/types";
import { createBackupStateMachine } from "../create-backup/CreateBackupStateMachine";
import type { CreateBackupStateMachineInput } from "../create-backup/types";
import { preChecksStateMachine } from "../pre-checks/PreChecksStateMachine";
import { PreChecksNextAction, type PreChecksStateMachineInput } from "../pre-checks/types";
import { restoreBackupStateMachine } from "../restore-backup/RestoreBackupStateMachine";
import type { RestoreBackupStateMachineInput } from "../restore-backup/types";
import {
  OsUpdatesOrchestratorStateMachineContext,
  OsUpdatesOrchestratorStateMachineEventType,
  OsUpdatesOrchestratorStateMachineInput,
  type OsUpdatesOrchestratorStateMachineEvent,
} from "./types";
import { stepLoadingState } from "./utils/stepLoadingState";
import { unexpectedErrorState } from "./utils/unexpectedErrorState";

const LOG_TYPE = "OsUpdatesOrchestrator";

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
    applyUpdates: applyUpdatesStateMachine,
    restoreBackup: restoreBackupStateMachine,
  },
  actions: {
    enterStep: assign({
      currentStep: (_, step: OsUpdatesSteps) => step,
      currentState: (_, step: OsUpdatesSteps) => stepLoadingState(step),
    }),
    logStepEntered: (_, step: OsUpdatesSteps) => {
      log(LOG_TYPE, "state: step", { step });
    },
    logChildFailed: (_, params: { step: OsUpdatesSteps; error: unknown }) => {
      log(LOG_TYPE, "state: Failed", { step: params.step, error: params.error });
    },
    logStopRequested: ({ context }) => {
      log(LOG_TYPE, "event: stop", { step: context.currentStep });
    },
    logFinished: (_, outcome: "Done" | "Stopped") => {
      log(LOG_TYPE, `state: ${outcome}`);
    },
    stopChildren: enqueueActions(({ enqueue }) => {
      enqueue.stopChild("preChecks");
      enqueue.stopChild("createBackup");
      enqueue.stopChild("applyUpdates");
      enqueue.stopChild("restoreBackup");
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
    rememberChildError: assign({
      failedError: ({ event }) => ("error" in event ? event.error : undefined),
    }),
    assignUnexpectedError: assign({
      currentState: ({ context, self }) =>
        unexpectedErrorState(
          context.currentStep,
          () => self.send({ type: OsUpdatesOrchestratorStateMachineEventType.STOP }),
          context.failedError,
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
      actions: ["logStopRequested", "stopChildren", "callOnStop"],
    },
  },
  states: {
    PreChecks: {
      entry: [
        { type: "enterStep", params: OsUpdatesSteps.PRE_CHECKS },
        { type: "logStepEntered", params: OsUpdatesSteps.PRE_CHECKS },
      ],
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
            guard: ({ event }) => event.output === PreChecksNextAction.PerformOsUpdates,
            target: "ApplyUpdates",
          },
          {
            guard: ({ event }) => event.output === PreChecksNextAction.RestoreBackup,
            target: "RestoreBackup",
          },
          {
            target: "Done",
          },
        ],
        onError: {
          target: "Failed",
          actions: [
            "rememberChildError",
            {
              type: "logChildFailed",
              params: ({ context, event }) => ({ step: context.currentStep, error: event.error }),
            },
          ],
        },
      },
    },
    CreateBackup: {
      entry: [
        { type: "enterStep", params: OsUpdatesSteps.CREATE_BACKUP },
        { type: "logStepEntered", params: OsUpdatesSteps.CREATE_BACKUP },
      ],
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
          target: "ApplyUpdates",
        },
        onError: {
          target: "Failed",
          actions: [
            "rememberChildError",
            {
              type: "logChildFailed",
              params: ({ context, event }) => ({ step: context.currentStep, error: event.error }),
            },
          ],
        },
      },
    },
    ApplyUpdates: {
      entry: [
        { type: "enterStep", params: OsUpdatesSteps.APPLY_UPDATES },
        { type: "logStepEntered", params: OsUpdatesSteps.APPLY_UPDATES },
      ],
      invoke: {
        id: "applyUpdates",
        src: "applyUpdates",
        input: ({ context, self }): ApplyUpdatesStateMachineInput => ({
          dmk: context.dmk,
          connectedDevice: context.connectedDevice,
          osUpdates: context.osUpdates,
          storage: context.storage,
          unlockTimeout: context.unlockTimeout,
          parentRef: self,
        }),
        onDone: {
          target: "Done",
        },
        onError: {
          target: "Failed",
          actions: [
            "rememberChildError",
            {
              type: "logChildFailed",
              params: ({ context, event }) => ({ step: context.currentStep, error: event.error }),
            },
          ],
        },
      },
    },
    RestoreBackup: {
      entry: [
        { type: "enterStep", params: OsUpdatesSteps.RESTORE_BACKUP },
        { type: "logStepEntered", params: OsUpdatesSteps.RESTORE_BACKUP },
      ],
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
          target: "Done",
        },
        onError: {
          target: "Failed",
          actions: [
            "rememberChildError",
            {
              type: "logChildFailed",
              params: ({ context, event }) => ({ step: context.currentStep, error: event.error }),
            },
          ],
        },
      },
    },
    Failed: {
      entry: "assignUnexpectedError",
    },
    Done: {
      type: "final",
      entry: { type: "logFinished", params: "Done" },
    },
    Stopped: {
      type: "final",
      entry: { type: "logFinished", params: "Stopped" },
    },
  },
});
