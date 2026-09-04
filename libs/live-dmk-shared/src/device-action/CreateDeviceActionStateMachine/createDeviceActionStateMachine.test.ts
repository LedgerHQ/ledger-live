import {
  DeviceActionStatus,
  UnknownDAError,
  UserInteractionRequired,
  type DeviceAction,
  type DeviceActionIntermediateValue,
  type DeviceManagementKit,
  type DmkError,
} from "@ledgerhq/device-management-kit";
import { Left, Right } from "purify-ts";
import { Subject } from "rxjs";
import { createActor, waitFor, type Actor } from "xstate";
import { createDeviceActionStateMachine } from "./createDeviceActionStateMachine";
import { DeviceActionStoppedError } from "./DeviceActionStoppedError";

const SESSION_ID = "session-id";
const DA_INPUT = { appName: "Bitcoin" };
const DA_OUTPUT = { installed: true };
const DEVICE_ACTION = { name: "MockDeviceAction" } as unknown as DeviceAction<
  typeof DA_OUTPUT,
  typeof DA_INPUT,
  DmkError,
  DeviceActionIntermediateValue
>;

type DeviceActionRun = {
  states: Subject<unknown>;
  cancel: jest.Mock;
};

describe("createDeviceActionStateMachine", () => {
  let deviceActionRuns: DeviceActionRun[];
  let executeDeviceAction: jest.Mock;
  let createDeviceAction: jest.Mock;
  let dmk: DeviceManagementKit;
  let actor: Actor<ReturnType<typeof createDeviceActionStateMachine>>;

  const settle = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  const latestRun = () => deviceActionRuns[deviceActionRuns.length - 1];

  const start = () => {
    const machine = createDeviceActionStateMachine({ createDeviceAction });
    actor = createActor(machine, {
      input: {
        dmk,
        sessionId: SESSION_ID,
        daInput: DA_INPUT,
      },
    });
    actor.start();
    return actor;
  };

  const waitUntilSettled = () => waitFor(actor, snapshot => snapshot.status === "done");

  const emit = async (state: unknown) => {
    latestRun().states.next(state);
    await settle();
  };

  const complete = async (state?: unknown) => {
    if (state !== undefined) {
      latestRun().states.next(state);
    }
    latestRun().states.complete();
    await waitUntilSettled();
  };

  const failActor = async (error: unknown) => {
    latestRun().states.error(error);
    await waitUntilSettled();
  };

  beforeEach(() => {
    deviceActionRuns = [];
    createDeviceAction = jest.fn(() => DEVICE_ACTION);
    executeDeviceAction = jest.fn(() => {
      const run: DeviceActionRun = { states: new Subject(), cancel: jest.fn() };
      deviceActionRuns.push(run);
      return { observable: run.states.asObservable(), cancel: run.cancel };
    });
    dmk = { executeDeviceAction } as unknown as DeviceManagementKit;
  });

  afterEach(() => {
    actor?.stop();
  });

  describe("success", () => {
    it("should execute the device action created from the given input", async () => {
      start();
      await settle();

      expect(createDeviceAction).toHaveBeenCalledWith(DA_INPUT);
      expect(executeDeviceAction).toHaveBeenCalledWith({
        sessionId: SESSION_ID,
        deviceAction: DEVICE_ACTION,
      });
    });

    it("should assign pending intermediate values while keeping the last pending value on later snapshots", async () => {
      const firstPending = { requiredUserInteraction: UserInteractionRequired.ConfirmOpenApp };
      const secondPending = { requiredUserInteraction: UserInteractionRequired.None };

      start();
      await emit({
        status: DeviceActionStatus.Pending,
        intermediateValue: firstPending,
      });
      expect(actor.getSnapshot().context.intermediateValue).toEqual(firstPending);

      await emit({
        status: DeviceActionStatus.Pending,
        intermediateValue: secondPending,
      });

      await emit({ status: DeviceActionStatus.Completed, output: DA_OUTPUT });
      expect(actor.getSnapshot().context.intermediateValue).toEqual(secondPending);
      expect(actor.getSnapshot().context.lastState).toEqual({
        status: DeviceActionStatus.Completed,
        output: DA_OUTPUT,
      });
    });

    it("should return the device action output when it completes successfully", async () => {
      start();
      await complete({ status: DeviceActionStatus.Completed, output: DA_OUTPUT });

      expect(actor.getSnapshot().value).toBe("Done");
      expect(actor.getSnapshot().output).toEqual(Right(DA_OUTPUT));
    });

    it("should cancel the device action when the actor is stopped while running", async () => {
      start();
      await settle();

      actor.stop();

      expect(latestRun().cancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("error", () => {
    it("should return the device action error when it completes with an error status", async () => {
      const daError = new UnknownDAError("device-action-failed");
      start();
      await complete({ status: DeviceActionStatus.Error, error: daError });

      expect(actor.getSnapshot().value).toBe("Done");
      expect(actor.getSnapshot().output).toEqual(Left(daError));
    });

    it("should return a DeviceActionStoppedError when the device action is stopped", async () => {
      start();
      await complete({ status: DeviceActionStatus.Stopped });

      expect(actor.getSnapshot().output).toEqual(Left(new DeviceActionStoppedError()));
    });

    it("should return an UnknownDAError when the observable errors with an Error", async () => {
      start();
      await failActor(new Error("crac crash boom"));

      expect(actor.getSnapshot().value).toBe("Failed");
      expect(actor.getSnapshot().output).toEqual(Left(new UnknownDAError("crac crash boom")));
    });

    it("should return an UnknownDAError when the observable errors with a non-Error value", async () => {
      start();
      await failActor("not-an-error");

      expect(actor.getSnapshot().value).toBe("Failed");
      expect(actor.getSnapshot().output).toEqual(
        Left(new UnknownDAError("Device action actor failed")),
      );
    });

    it("should return an UnknownDAError when the observable completes without a terminal snapshot", async () => {
      start();
      await complete({
        status: DeviceActionStatus.Pending,
        intermediateValue: { requiredUserInteraction: UserInteractionRequired.None },
      });

      expect(actor.getSnapshot().output).toEqual(
        Left(new UnknownDAError("Device action completed without a terminal snapshot")),
      );
    });
  });
});
