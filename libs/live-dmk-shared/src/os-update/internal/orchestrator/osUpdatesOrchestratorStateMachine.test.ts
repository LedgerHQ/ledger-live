import type { ConnectedDevice, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { OsUpdate } from "@ledgerhq/dmk-ledger-wallet";
import { createActor, fromPromise, sendTo, setup, type Actor, type AnyActorRef } from "xstate";
import { CreateBackupStateType } from "../../api/model/CreateBackupState";
import { OsUpdatesSteps } from "../../api/model/OsUpdatesSteps";
import { PreChecksStateType } from "../../api/model/PreChecksState";
import { createBackupStateMachine } from "../create-backup/CreateBackupStateMachine";
import { preChecksStateMachine } from "../pre-checks/PreChecksStateMachine";
import { PreChecksNextAction } from "../pre-checks/types";
import { osUpdatesOrchestratorStateMachine } from "./osUpdatesOrchestratorStateMachine";
import {
  OsUpdatesOrchestratorStateMachineEventType,
  type OsUpdatesOrchestratorStateMachineActorRef,
  type OsUpdatesState,
} from "./types";
import { toProgress } from "./utils/toProgress";

const SESSION_ID = "session-id";
const AN_OS_UPDATE = {} as OsUpdate;
const CONNECTED_DEVICE = {
  id: "device-id",
  sessionId: SESSION_ID,
} as ConnectedDevice;

type StepStubEvent =
  | { type: "EMIT"; state: OsUpdatesState }
  | { type: "REQUEST_STOP" }
  | { type: "FINISH" };

/** Replaces a real step machine so the orchestrator wiring can be driven from the test. */
const stepStub = <TOutput>(output: TOutput) =>
  setup({
    types: {
      input: {} as { parentRef: OsUpdatesOrchestratorStateMachineActorRef },
      context: {} as { parentRef: OsUpdatesOrchestratorStateMachineActorRef },
      events: {} as StepStubEvent,
      output: {} as TOutput,
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
    output: () => output,
  });

const throwingStep = (message: string) =>
  fromPromise(async () => {
    throw new Error(message);
  });

const withSteps = ({
  preChecks,
  createBackup = stepStub(undefined),
}: {
  preChecks: unknown;
  createBackup?: unknown;
}) =>
  osUpdatesOrchestratorStateMachine.provide({
    actors: {
      preChecks: preChecks as unknown as typeof preChecksStateMachine,
      createBackup: createBackup as unknown as typeof createBackupStateMachine,
    },
  });

describe("OsUpdatesOrchestratorStateMachine", () => {
  let onStop: jest.Mock;
  let dmk: DeviceManagementKit;
  let actor: Actor<typeof osUpdatesOrchestratorStateMachine>;

  const child = (id: "preChecks" | "createBackup") =>
    actor.getSnapshot().children[id] as unknown as AnyActorRef | undefined;

  const progress = () => toProgress(actor.getSnapshot().context);

  const start = (machine: ReturnType<typeof withSteps>) => {
    actor = createActor(machine, {
      input: {
        dmk,
        connectedDevice: CONNECTED_DEVICE,
        osUpdates: [AN_OS_UPDATE],
        storage: { getBackup: jest.fn(async () => undefined), saveBackup: jest.fn() },
        onStop,
      },
    }) as unknown as Actor<typeof osUpdatesOrchestratorStateMachine>;
    actor.start();
    return actor;
  };

  /** Drives the pre-checks stub to completion, which routes on its output. */
  const finishPreChecks = () => {
    child("preChecks")?.send({ type: "FINISH" });
  };

  beforeEach(() => {
    onStop = jest.fn();
    dmk = {} as DeviceManagementKit;
  });

  afterEach(() => {
    actor?.stop();
  });

  describe("pre-checks step", () => {
    it("should start the pre-checks child with a loading pre-checks progress", () => {
      start(withSteps({ preChecks: stepStub(PreChecksNextAction.Completed) }));

      expect(actor.getSnapshot().value).toBe("PreChecks");
      expect(progress()).toEqual({
        step: OsUpdatesSteps.PRE_CHECKS,
        state: { type: PreChecksStateType.LOADING },
      });
    });

    it("should assign the state sent by the pre-checks child while staying on the pre-checks step", () => {
      start(withSteps({ preChecks: stepStub(PreChecksNextAction.Completed) }));

      child("preChecks")?.send({
        type: "EMIT",
        state: { type: PreChecksStateType.DEVICE_LOCKED },
      });

      expect(progress()).toEqual({
        step: OsUpdatesSteps.PRE_CHECKS,
        state: { type: PreChecksStateType.DEVICE_LOCKED },
      });
      expect(actor.getSnapshot().value).toBe("PreChecks");
    });

    it("should reach Done when the pre-checks child completes on any other next action", () => {
      start(withSteps({ preChecks: stepStub(PreChecksNextAction.PerformOsUpdates) }));

      finishPreChecks();

      expect(actor.getSnapshot().value).toBe("Done");
      expect(actor.getSnapshot().status).toBe("done");
    });

    it("should stop the pre-checks child and call onStop when the child requests a stop", () => {
      start(withSteps({ preChecks: stepStub(PreChecksNextAction.Completed) }));

      child("preChecks")?.send({ type: "REQUEST_STOP" });

      expect(actor.getSnapshot().value).toBe("Stopped");
      expect(onStop).toHaveBeenCalledTimes(1);
      expect(child("preChecks")).toBeUndefined();
    });

    it("should emit the pre-checks UNEXPECTED_ERROR when the pre-checks child throws", async () => {
      start(withSteps({ preChecks: throwingStep("pre-checks crashed") }));
      await Promise.resolve();

      expect(actor.getSnapshot().value).toBe("Failed");
      const { state } = progress();
      expect(state.type).toBe(PreChecksStateType.UNEXPECTED_ERROR);

      if (state.type !== PreChecksStateType.UNEXPECTED_ERROR) {
        throw new Error("expected UNEXPECTED_ERROR");
      }
      state.cancel();

      expect(actor.getSnapshot().value).toBe("Stopped");
      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });

  describe("create-backup step", () => {
    it("should enter the create-backup step with a loading create-backup progress", () => {
      start(withSteps({ preChecks: stepStub(PreChecksNextAction.CreateBackup) }));

      finishPreChecks();

      expect(actor.getSnapshot().value).toBe("CreateBackup");
      expect(progress()).toEqual({
        step: OsUpdatesSteps.CREATE_BACKUP,
        state: { type: CreateBackupStateType.LOADING },
      });
    });

    it("should assign the state sent by the create-backup child under the create-backup step", () => {
      start(withSteps({ preChecks: stepStub(PreChecksNextAction.CreateBackup) }));
      finishPreChecks();

      child("createBackup")?.send({
        type: "EMIT",
        state: { type: CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION },
      });

      expect(progress()).toEqual({
        step: OsUpdatesSteps.CREATE_BACKUP,
        state: { type: CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION },
      });
    });

    it("should reach Done when the create-backup child completes", () => {
      start(withSteps({ preChecks: stepStub(PreChecksNextAction.CreateBackup) }));
      finishPreChecks();

      child("createBackup")?.send({ type: "FINISH" });

      expect(actor.getSnapshot().value).toBe("Done");
      expect(actor.getSnapshot().status).toBe("done");
    });

    it("should stop the create-backup child and call onStop when the child requests a stop", () => {
      start(withSteps({ preChecks: stepStub(PreChecksNextAction.CreateBackup) }));
      finishPreChecks();

      child("createBackup")?.send({ type: "REQUEST_STOP" });

      expect(actor.getSnapshot().value).toBe("Stopped");
      expect(onStop).toHaveBeenCalledTimes(1);
      expect(child("createBackup")).toBeUndefined();
    });

    it("should emit the create-backup UNEXPECTED_ERROR when the create-backup child throws", async () => {
      start(
        withSteps({
          preChecks: stepStub(PreChecksNextAction.CreateBackup),
          createBackup: throwingStep("create-backup crashed"),
        }),
      );

      finishPreChecks();
      await Promise.resolve();

      expect(actor.getSnapshot().value).toBe("Failed");
      expect(progress()).toEqual({
        step: OsUpdatesSteps.CREATE_BACKUP,
        state: {
          type: CreateBackupStateType.UNEXPECTED_ERROR,
          cancel: expect.any(Function),
        },
      });
    });
  });
});
