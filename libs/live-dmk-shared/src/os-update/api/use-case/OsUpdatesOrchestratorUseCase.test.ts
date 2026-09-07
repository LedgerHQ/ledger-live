import type { ConnectedDevice, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { OsUpdate } from "@ledgerhq/dmk-ledger-wallet";
import { createActor } from "xstate";
import { OsUpdatesSteps } from "../model/OsUpdatesSteps";
import { PreChecksStateType } from "../model/PreChecksState";
import type { OsUpdatesProgress } from "../model/OsUpdatesProgress";
import { OsUpdatesOrchestratorStateMachineEventType } from "../../internal/orchestrator/types";
import { OsUpdatesOrchestratorUseCase } from "./OsUpdatesOrchestratorUseCase";

const LOADING_PROGRESS: OsUpdatesProgress = {
  step: OsUpdatesSteps.PRE_CHECKS,
  state: { type: PreChecksStateType.LOADING },
};

const DEVICE_LOCKED_PROGRESS: OsUpdatesProgress = {
  step: OsUpdatesSteps.PRE_CHECKS,
  state: { type: PreChecksStateType.DEVICE_LOCKED },
};

const CONNECTED_DEVICE = { id: "device-id", sessionId: "session-id" } as ConnectedDevice;

type Snapshot = { context: { currentState: OsUpdatesProgress } };
type SnapshotObserver = {
  next?: (snapshot: Snapshot) => void;
  error?: (error: unknown) => void;
};

jest.mock("xstate", () => {
  const actual = jest.requireActual("xstate");
  return {
    ...actual,
    createActor: jest.fn(),
  };
});

jest.mock("../../internal/orchestrator/osUpdatesOrchestratorStateMachine", () => ({
  osUpdatesOrchestratorStateMachine: { id: "osUpdatesOrchestrator" },
}));

describe("OsUpdatesOrchestratorUseCase", () => {
  const createActorMock = createActor as jest.MockedFunction<typeof createActor>;
  let start: jest.Mock;
  let send: jest.Mock;
  let onStop: jest.Mock;
  let snapshotObserver: SnapshotObserver | undefined;
  let unsubscribe: jest.Mock;

  const execute = () =>
    new OsUpdatesOrchestratorUseCase().execute({
      dmk: {} as DeviceManagementKit,
      connectedDevice: CONNECTED_DEVICE,
      osUpdates: [{} as OsUpdate],
      storage: { getBackup: jest.fn() },
      onStop,
    });

  beforeEach(() => {
    onStop = jest.fn();
    start = jest.fn();
    send = jest.fn();
    unsubscribe = jest.fn();
    snapshotObserver = undefined;
    createActorMock.mockReturnValue({
      start,
      send,
      getSnapshot: () => ({ context: { currentState: DEVICE_LOCKED_PROGRESS } }),
      subscribe: (observer: SnapshotObserver) => {
        snapshotObserver = observer;
        observer.next?.({ context: { currentState: LOADING_PROGRESS } });
        return {
          unsubscribe: () => {
            snapshotObserver = undefined;
            unsubscribe();
          },
        };
      },
    } as never);
  });

  describe("success", () => {
    it("should create the orchestrator actor from the given input", () => {
      execute();

      expect(createActorMock).toHaveBeenCalledTimes(1);
      expect(createActorMock.mock.calls[0]?.[1]).toEqual(
        expect.objectContaining({
          input: expect.objectContaining({
            connectedDevice: CONNECTED_DEVICE,
            onStop,
          }),
        }),
      );
    });

    it("should start the orchestrator actor when start is called", () => {
      const orchestrator = execute();

      orchestrator.start();

      expect(start).toHaveBeenCalledTimes(1);
    });

    it("should send STOP to the orchestrator actor when stop is called", () => {
      const orchestrator = execute();

      orchestrator.stop();

      expect(send).toHaveBeenCalledWith({
        type: OsUpdatesOrchestratorStateMachineEventType.STOP,
      });
    });

    it("should notify the subscriber with the current progress", () => {
      const listener = jest.fn();
      const orchestrator = execute();

      orchestrator.subscribe(listener);

      expect(listener).toHaveBeenCalledWith(LOADING_PROGRESS);
    });

    it("should notify the subscriber when progress is updated", () => {
      const listener = jest.fn();
      const orchestrator = execute();
      orchestrator.subscribe(listener);
      listener.mockClear();

      snapshotObserver?.next?.({ context: { currentState: DEVICE_LOCKED_PROGRESS } });

      expect(listener).toHaveBeenCalledWith(DEVICE_LOCKED_PROGRESS);
    });

    it("should stop delivering snapshots after unsubscribe", () => {
      const listener = jest.fn();
      const orchestrator = execute();
      const { unsubscribe: unsubscribeListener } = orchestrator.subscribe(listener);
      listener.mockClear();

      unsubscribeListener();
      snapshotObserver?.next?.({ context: { currentState: DEVICE_LOCKED_PROGRESS } });

      expect(unsubscribe).toHaveBeenCalledTimes(1);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("error", () => {
    it("should notify UNEXPECTED_ERROR on the step reached so far when the actor errors", () => {
      const listener = jest.fn();
      const orchestrator = execute();
      orchestrator.subscribe(listener);
      listener.mockClear();

      snapshotObserver?.error?.(new Error("actor crashed"));

      expect(listener).toHaveBeenCalledWith({
        step: DEVICE_LOCKED_PROGRESS.step,
        state: {
          type: PreChecksStateType.UNEXPECTED_ERROR,
          cancel: expect.any(Function),
        },
      });
    });

    it("should send STOP to the orchestrator actor when the error state is cancelled", () => {
      const listener = jest.fn();
      const orchestrator = execute();
      orchestrator.subscribe(listener);
      listener.mockClear();
      snapshotObserver?.error?.(new Error("actor crashed"));

      listener.mock.calls[0][0].state.cancel();

      expect(send).toHaveBeenCalledWith({
        type: OsUpdatesOrchestratorStateMachineEventType.STOP,
      });
      expect(onStop).not.toHaveBeenCalled();
    });
  });
});
