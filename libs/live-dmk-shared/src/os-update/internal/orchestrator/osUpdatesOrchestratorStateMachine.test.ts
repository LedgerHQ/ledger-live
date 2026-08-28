import type { ConnectedDevice, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { OsUpdate } from "@ledgerhq/dmk-ledger-wallet";
import { createActor, fromPromise, sendTo, setup, type Actor, type AnyActorRef } from "xstate";
import { OsUpdatesSteps } from "../../api/model/OsUpdatesSteps";
import { PreChecksStateType, type PreChecksState } from "../../api/model/PreChecksState";
import { preChecksStateMachine } from "../pre-checks/PreChecksStateMachine";
import { PreChecksNextAction, type PreChecksStateMachineInput } from "../pre-checks/types";
import {
  OsUpdatesOrchestratorStateMachineEventType,
  type OsUpdatesOrchestratorStateMachineActorRef,
} from "./types";
import { osUpdatesOrchestratorStateMachine } from "./osUpdatesOrchestratorStateMachine";

const SESSION_ID = "session-id";
const AN_OS_UPDATE = {} as OsUpdate;
const CONNECTED_DEVICE = {
  id: "device-id",
  sessionId: SESSION_ID,
} as ConnectedDevice;

type PreChecksStubEvent =
  | { type: "EMIT"; state: PreChecksState }
  | { type: "REQUEST_STOP" }
  | { type: "FINISH" };

/** Replaces the real pre-checks machine so the orchestrator wiring can be driven from the test. */
const preChecksStub = setup({
  types: {
    input: {} as PreChecksStateMachineInput,
    context: {} as { parentRef: OsUpdatesOrchestratorStateMachineActorRef },
    events: {} as PreChecksStubEvent,
    output: {} as PreChecksNextAction,
  },
}).createMachine({
  context: ({ input }) => ({ parentRef: input.parentRef }),
  initial: "Running",
  states: {
    Running: {
      on: {
        EMIT: {
          actions: sendTo(
            ({ context }) => context.parentRef,
            ({ event }) => ({
              type: OsUpdatesOrchestratorStateMachineEventType.STATE_UPDATE,
              state: event.state,
            }),
          ),
        },
        REQUEST_STOP: {
          actions: sendTo(({ context }) => context.parentRef, {
            type: OsUpdatesOrchestratorStateMachineEventType.STOP,
          }),
        },
        FINISH: "Done",
      },
    },
    Done: {
      type: "final",
    },
  },
  output: () => PreChecksNextAction.Completed,
});

const machineWithStubbedPreChecks = osUpdatesOrchestratorStateMachine.provide({
  actors: {
    preChecks: preChecksStub as unknown as typeof preChecksStateMachine,
  },
});

const machineWithThrowingPreChecks = osUpdatesOrchestratorStateMachine.provide({
  actors: {
    preChecks: fromPromise(async () => {
      throw new Error("pre-checks crashed");
    }) as unknown as typeof preChecksStateMachine,
  },
});

describe("OsUpdatesOrchestratorStateMachine", () => {
  let onStop: jest.Mock;
  let dmk: DeviceManagementKit;
  let actor: Actor<typeof machineWithStubbedPreChecks>;

  const preChecksChild = () =>
    actor.getSnapshot().children.preChecks as unknown as AnyActorRef | undefined;

  const start = () => {
    actor = createActor(machineWithStubbedPreChecks, {
      input: {
        dmk,
        connectedDevice: CONNECTED_DEVICE,
        osUpdates: [AN_OS_UPDATE],
        storage: { getBackup: jest.fn(async () => undefined) },
        onStop,
      },
    });
    actor.start();
    return actor;
  };

  beforeEach(() => {
    onStop = jest.fn();
    dmk = {} as DeviceManagementKit;
  });

  afterEach(() => {
    actor?.stop();
  });

  describe("success", () => {
    it("should start the pre-checks child with a loading pre-checks progress", () => {
      start();

      expect(actor.getSnapshot().value).toBe("PreChecks");
      expect(actor.getSnapshot().context.currentState).toEqual({
        step: OsUpdatesSteps.PRE_CHECKS,
        state: { type: PreChecksStateType.LOADING },
      });
    });

    it("should assign the state sent by the pre-checks child while staying on the pre-checks step", () => {
      start();

      preChecksChild()?.send({
        type: "EMIT",
        state: { type: PreChecksStateType.DEVICE_LOCKED },
      });

      expect(actor.getSnapshot().context.currentState).toEqual({
        step: OsUpdatesSteps.PRE_CHECKS,
        state: { type: PreChecksStateType.DEVICE_LOCKED },
      });
      expect(actor.getSnapshot().value).toBe("PreChecks");
    });

    it("should reach Done when the pre-checks child completes", () => {
      start();

      preChecksChild()?.send({ type: "FINISH" });

      expect(actor.getSnapshot().value).toBe("Done");
      expect(actor.getSnapshot().status).toBe("done");
    });
  });

  describe("error", () => {
    it("should stop the pre-checks child and call onStop when the child requests a stop", () => {
      start();

      preChecksChild()?.send({ type: "REQUEST_STOP" });

      expect(actor.getSnapshot().value).toBe("Stopped");
      expect(onStop).toHaveBeenCalledTimes(1);
      expect(preChecksChild()).toBeUndefined();
    });

    it("should emit UNEXPECTED_ERROR when the pre-checks child throws", async () => {
      actor = createActor(machineWithThrowingPreChecks, {
        input: {
          dmk,
          connectedDevice: CONNECTED_DEVICE,
          osUpdates: [AN_OS_UPDATE],
          storage: { getBackup: jest.fn(async () => undefined) },
          onStop,
        },
      }) as unknown as Actor<typeof machineWithStubbedPreChecks>;
      actor.start();
      await Promise.resolve();

      expect(actor.getSnapshot().value).toBe("Failed");
      expect(actor.getSnapshot().context.currentState.state.type).toBe(
        PreChecksStateType.UNEXPECTED_ERROR,
      );

      const state = actor.getSnapshot().context.currentState.state;
      if (state.type !== PreChecksStateType.UNEXPECTED_ERROR) {
        throw new Error("expected UNEXPECTED_ERROR");
      }
      state.cancel();

      expect(actor.getSnapshot().value).toBe("Stopped");
      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });
});
