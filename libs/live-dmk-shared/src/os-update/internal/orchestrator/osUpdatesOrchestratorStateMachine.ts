import { assign, setup, stopChild } from "xstate";
import { OsUpdatesSteps } from "../../api/model/OsUpdatesSteps";
import { PreChecksStateType } from "../../api/model/PreChecksState";
import { preChecksStateMachine } from "../pre-checks/PreChecksStateMachine";
import type { PreChecksStateMachineInput } from "../pre-checks/types";
import {
  OsUpdatesOrchestratorStateMachineContext,
  OsUpdatesOrchestratorStateMachineEventType,
  OsUpdatesOrchestratorStateMachineInput,
  type OsUpdatesOrchestratorStateMachineEvent,
} from "./types";

export const osUpdatesOrchestratorStateMachine = setup({
  types: {
    input: {} as OsUpdatesOrchestratorStateMachineInput,
    context: {} as OsUpdatesOrchestratorStateMachineContext,
    events: {} as OsUpdatesOrchestratorStateMachineEvent,
    output: {} as unknown as void,
  },
  actors: {
    preChecks: preChecksStateMachine,
  },
  actions: {
    stopChildren: stopChild("preChecks"),
    callOnStop: ({ context }) => {
      context.onStop();
    },
    assignStateUpdate: assign({
      currentState: ({ event, context }) => {
        if (event.type !== OsUpdatesOrchestratorStateMachineEventType.STATE_UPDATE) {
          return context.currentState;
        }
        return { ...context.currentState, state: event.state };
      },
    }),
    assignUnexpectedError: assign({
      currentState: ({ context, self }) => ({
        ...context.currentState,
        state: {
          type: PreChecksStateType.UNEXPECTED_ERROR,
          cancel: () => self.send({ type: OsUpdatesOrchestratorStateMachineEventType.STOP }),
        },
      }),
    }),
  },
}).createMachine({
  id: "osUpdatesOrchestrator",
  context: ({ input }) => ({
    ...input,
    currentState: { step: OsUpdatesSteps.PRE_CHECKS, state: { type: PreChecksStateType.LOADING } },
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
