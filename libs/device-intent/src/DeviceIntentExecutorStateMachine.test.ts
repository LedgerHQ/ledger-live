import { of, NEVER, Subject, throwError, Observable } from "rxjs";
import {
  DefaultDeviceIntentExecutorStateMachine,
  type StateMachineListeners,
} from "./DeviceIntentExecutorStateMachine";
import type { Intent } from "./core";
import type { ExecutorState } from "./executor";
import {
  makeExtractedContext,
  makeIntent as makeBaseIntent,
  makeConnectionResult,
  flushMicrotasks,
} from "./__tests__/test-utils";

// ---- Test helpers ----

type TestJobState = { step: "running" } | { step: "done" };

const makeIntent = (job: () => Observable<unknown> = () => NEVER) => makeBaseIntent({ job });

function makeListeners(): StateMachineListeners<unknown, unknown, unknown> & {
  executorStates: ExecutorState[];
  jobStates: unknown[];
  jobCompletes: Intent<unknown, unknown, unknown>[];
  jobErrors: Array<{ intent: Intent<unknown, unknown, unknown>; error: unknown }>;
} {
  const executorStates: ExecutorState[] = [];
  const jobStates: unknown[] = [];
  const jobCompletes: Intent<unknown, unknown, unknown>[] = [];
  const jobErrors: Array<{ intent: Intent<unknown, unknown, unknown>; error: unknown }> = [];
  return {
    executorStates,
    jobStates,
    jobCompletes,
    jobErrors,
    onExecutorStateChanged: jest.fn((state: ExecutorState) => {
      executorStates.push(state);
    }),
    onIntentJobStateChanged: jest.fn(
      (_intent: Intent<unknown, unknown, unknown>, jobState: unknown) => {
        jobStates.push(jobState);
      },
    ),
    onIntentJobComplete: jest.fn((intent: Intent<unknown, unknown, unknown>) => {
      jobCompletes.push(intent);
    }),
    onIntentJobError: jest.fn((intent: Intent<unknown, unknown, unknown>, error: unknown) => {
      jobErrors.push({ intent, error });
    }),
  };
}

function createSM(
  overrides: {
    job?: () => Observable<unknown>;
    intent?: Intent<unknown, unknown, unknown>;
    listeners?: ReturnType<typeof makeListeners>;
  } = {},
) {
  const listeners = overrides.listeners ?? makeListeners();
  const intent = overrides.intent ?? makeIntent(overrides.job);
  const sm = new DefaultDeviceIntentExecutorStateMachine({
    deviceConnectionParams: { acceptedDeviceModelIds: [] },
    intent,
    listeners,
  });
  return { sm, listeners };
}

function driveToExecution(
  sm: DefaultDeviceIntentExecutorStateMachine<unknown, unknown, unknown>,
  connectionResult = makeConnectionResult(),
  extractedContext = makeExtractedContext(),
) {
  sm.deviceConnected(connectionResult);
  sm.deviceContextInitialized(extractedContext);
}

function lastExecutorState(listeners: ReturnType<typeof makeListeners>): ExecutorState | undefined {
  return listeners.executorStates[listeners.executorStates.length - 1];
}

// ---- Tests ----

describe("DeviceIntentExecutorStateMachine", () => {
  describe("GIVEN the machine just started", () => {
    it("THEN it emits connectingDevice", () => {
      const { sm, listeners } = createSM();
      expect(listeners.onExecutorStateChanged).toHaveBeenCalledWith({ type: "connectingDevice" });
      expect(lastExecutorState(listeners)).toEqual({ type: "connectingDevice" });
      sm.stop();
    });
  });

  describe("GIVEN the machine is in deviceConnection state", () => {
    it("WHEN DEVICE_CONNECTED is received THEN it transitions to initializingDeviceContext", () => {
      const { sm, listeners } = createSM();
      sm.deviceConnected(makeConnectionResult());
      expect(lastExecutorState(listeners)).toEqual({ type: "initializingDeviceContext" });
      sm.stop();
    });

    it("WHEN CONNECTION_ERROR is received THEN it transitions to connectingDeviceError", () => {
      const { sm, listeners } = createSM();
      const err = new Error("connection failed");
      sm.connectionError(err);
      expect(lastExecutorState(listeners)).toEqual({
        type: "connectingDeviceError",
        error: err,
      });
      sm.stop();
    });
  });

  describe("GIVEN the machine is in connectionError state", () => {
    it("WHEN RETRY is received THEN it transitions back to connectingDevice", () => {
      const { sm, listeners } = createSM();
      sm.connectionError(new Error("fail"));
      expect(lastExecutorState(listeners)?.type).toBe("connectingDeviceError");

      sm.retry();
      expect(lastExecutorState(listeners)).toEqual({ type: "connectingDevice" });
      sm.stop();
    });
  });

  describe("GIVEN the machine is in deviceInitialization state", () => {
    it("WHEN DEVICE_CONTEXT_INITIALIZED is received THEN it transitions to executingIntent", () => {
      const { sm, listeners } = createSM({ job: () => NEVER });
      sm.deviceConnected(makeConnectionResult());
      sm.deviceContextInitialized(makeExtractedContext());
      expect(lastExecutorState(listeners)).toEqual({ type: "executingIntent" });
      sm.stop();
    });

    it("WHEN DEVICE_DISCONNECTED is received THEN it transitions to connectingDeviceError", () => {
      const { sm, listeners } = createSM();
      sm.deviceConnected(makeConnectionResult());
      sm.deviceDisconnected();
      expect(lastExecutorState(listeners)).toEqual({
        type: "connectingDeviceError",
        error: null,
      });
      sm.stop();
    });

    it("WHEN SET_INTENT is received THEN it stays in initializingDeviceContext without extra listener call", () => {
      const { sm, listeners } = createSM({ job: () => NEVER });
      sm.deviceConnected(makeConnectionResult());
      expect(lastExecutorState(listeners)).toEqual({ type: "initializingDeviceContext" });
      const callCountBefore = (listeners.onExecutorStateChanged as jest.Mock).mock.calls.length;

      const newIntent = makeIntent(() => NEVER);
      sm.setIntent(newIntent);

      expect(lastExecutorState(listeners)).toEqual({ type: "initializingDeviceContext" });
      const callCountAfter = (listeners.onExecutorStateChanged as jest.Mock).mock.calls.length;
      expect(callCountAfter).toBe(callCountBefore);
      sm.stop();
    });
  });

  describe("GIVEN the machine is in intentExecution state", () => {
    it("THEN the job receives the correct parameters", () => {
      const connectionResult = makeConnectionResult();
      const extractedContext = makeExtractedContext();
      const jobInput = { amount: 42 };
      const jobSpy = jest.fn(() => of("done"));
      const intent: Intent<unknown, unknown, unknown> = {
        ...makeIntent(),
        job: jobSpy,
        input: jobInput,
      };
      const { sm } = createSM({ intent });
      driveToExecution(sm, connectionResult, extractedContext);
      expect(jobSpy).toHaveBeenCalledWith({
        deviceConnectionResult: connectionResult,
        deviceExtractedContext: extractedContext,
        input: jobInput,
      });
      sm.stop();
    });

    it("WHEN the job emits values THEN onIntentJobStateChanged is called for each emission", async () => {
      const subject = new Subject<TestJobState>();
      const { sm, listeners } = createSM({ job: () => subject.asObservable() });
      driveToExecution(sm);
      expect(lastExecutorState(listeners)).toEqual({ type: "executingIntent" });

      subject.next({ step: "running" });
      await flushMicrotasks();
      expect(listeners.jobStates).toContainEqual({ step: "running" });

      subject.next({ step: "done" });
      await flushMicrotasks();
      expect(listeners.jobStates).toContainEqual({ step: "done" });

      sm.stop();
    });

    it("WHEN the job observable completes THEN onIntentJobComplete is called and it transitions to idle", async () => {
      const subject = new Subject<TestJobState>();
      const intent = makeIntent(() => subject.asObservable());
      const { sm, listeners } = createSM({ intent });
      driveToExecution(sm);

      subject.next({ step: "done" });
      subject.complete();
      await flushMicrotasks();

      expect(listeners.onIntentJobComplete).toHaveBeenCalledWith(intent);
      expect(lastExecutorState(listeners)).toEqual({ type: "idle" });
      sm.stop();
    });

    it("WHEN the job completes synchronously THEN it transitions to idle", () => {
      const intent = makeIntent(() => of({ step: "done" as const }));
      const { sm, listeners } = createSM({ intent });
      driveToExecution(sm);
      expect(lastExecutorState(listeners)).toEqual({ type: "idle" });
      expect(listeners.onIntentJobComplete).toHaveBeenCalledWith(intent);
      sm.stop();
    });

    it("WHEN the job observable errors THEN onIntentJobError is called and it transitions to executingIntentError", () => {
      const jobError = new Error("job failed");
      const intent = makeIntent(() => throwError(() => jobError));
      const { sm, listeners } = createSM({ intent });
      driveToExecution(sm);
      expect(lastExecutorState(listeners)).toEqual({
        type: "executingIntentError",
        error: jobError,
      });
      expect(listeners.onIntentJobError).toHaveBeenCalledWith(intent, jobError);
      sm.stop();
    });

    it("WHEN DEVICE_DISCONNECTED is received THEN it transitions to connectingDeviceError", () => {
      const { sm, listeners } = createSM({ job: () => NEVER });
      driveToExecution(sm);
      sm.deviceDisconnected();
      expect(lastExecutorState(listeners)).toEqual({
        type: "connectingDeviceError",
        error: null,
      });
      sm.stop();
    });

    it("WHEN SET_INTENT is received THEN it transitions to invalidOperation", () => {
      const originalIntent = makeIntent(() => NEVER);
      const { sm, listeners } = createSM({ intent: originalIntent });
      driveToExecution(sm);
      const newIntent = makeIntent(() => NEVER);
      sm.setIntent(newIntent);
      expect(lastExecutorState(listeners)).toEqual({
        type: "invalidOperation",
        error: expect.objectContaining({
          message: "SET_INTENT received during intent execution",
        }),
      });
      sm.stop();
    });

    it("WHEN REINITIALIZE is received THEN it transitions to invalidOperation", () => {
      const originalIntent = makeIntent(() => NEVER);
      const { sm, listeners } = createSM({ intent: originalIntent });
      driveToExecution(sm);
      sm.reinitialize();
      expect(lastExecutorState(listeners)).toEqual({
        type: "invalidOperation",
        error: expect.objectContaining({
          message: "REINITIALIZE received during intent execution",
        }),
      });
      sm.stop();
    });

    it("WHEN STOP_INTENT is received THEN it transitions to idle", () => {
      const { sm, listeners } = createSM({ job: () => NEVER });
      driveToExecution(sm);
      sm.stopIntent();
      expect(lastExecutorState(listeners)).toEqual({ type: "idle" });
      sm.stop();
    });

    it("WHEN DEVICE_DISCONNECTED is received THEN the job observable is auto-cancelled", async () => {
      let subscribed = false;
      let unsubscribed = false;
      const job = () =>
        new Observable<TestJobState>(() => {
          subscribed = true;
          return () => {
            unsubscribed = true;
          };
        });
      const { sm } = createSM({ job });
      driveToExecution(sm);
      await flushMicrotasks();
      expect(subscribed).toBe(true);
      expect(unsubscribed).toBe(false);

      sm.deviceDisconnected();
      await flushMicrotasks();
      expect(unsubscribed).toBe(true);
      sm.stop();
    });

    it("WHEN STOP_INTENT is received THEN the job observable is auto-cancelled", async () => {
      let subscribed = false;
      let unsubscribed = false;
      const job = () =>
        new Observable<TestJobState>(() => {
          subscribed = true;
          return () => {
            unsubscribed = true;
          };
        });
      const { sm } = createSM({ job });
      driveToExecution(sm);
      await flushMicrotasks();
      expect(subscribed).toBe(true);
      expect(unsubscribed).toBe(false);

      sm.stopIntent();
      await flushMicrotasks();
      expect(unsubscribed).toBe(true);
      sm.stop();
    });

    it("WHEN SET_INTENT is received THEN the job observable is auto-cancelled", async () => {
      let subscribed = false;
      let unsubscribed = false;
      const job = () =>
        new Observable<TestJobState>(() => {
          subscribed = true;
          return () => {
            unsubscribed = true;
          };
        });
      const { sm } = createSM({ job });
      driveToExecution(sm);
      await flushMicrotasks();
      expect(subscribed).toBe(true);
      expect(unsubscribed).toBe(false);

      sm.setIntent(makeIntent(() => NEVER));
      await flushMicrotasks();
      expect(unsubscribed).toBe(true);
      sm.stop();
    });

    it("WHEN REINITIALIZE is received THEN the job observable is auto-cancelled", async () => {
      let subscribed = false;
      let unsubscribed = false;
      const job = () =>
        new Observable<TestJobState>(() => {
          subscribed = true;
          return () => {
            unsubscribed = true;
          };
        });
      const { sm } = createSM({ job });
      driveToExecution(sm);
      await flushMicrotasks();
      expect(subscribed).toBe(true);
      expect(unsubscribed).toBe(false);

      sm.reinitialize();
      await flushMicrotasks();
      expect(unsubscribed).toBe(true);
      sm.stop();
    });
  });

  describe("GIVEN the machine is in intentError state", () => {
    it("WHEN RETRY is received THEN it re-invokes the job and transitions to executingIntent", () => {
      let callCount = 0;
      const jobFn = () => {
        callCount++;
        if (callCount === 1) return throwError(() => new Error("fail"));
        return NEVER;
      };
      const { sm, listeners } = createSM({ job: jobFn });
      driveToExecution(sm);
      expect(lastExecutorState(listeners)?.type).toBe("executingIntentError");
      expect(callCount).toBe(1);

      sm.retry();
      expect(lastExecutorState(listeners)).toEqual({ type: "executingIntent" });
      expect(callCount).toBe(2);
      sm.stop();
    });

    it("WHEN SET_INTENT is received THEN it runs the new intent's job and transitions to executingIntent", () => {
      const newJobSpy = jest.fn(() => NEVER);
      const { sm, listeners } = createSM({ job: () => throwError(() => new Error("fail")) });
      driveToExecution(sm);
      expect(lastExecutorState(listeners)?.type).toBe("executingIntentError");

      const newIntent = makeIntent(newJobSpy);
      sm.setIntent(newIntent);
      expect(lastExecutorState(listeners)).toEqual({ type: "executingIntent" });
      expect(newJobSpy).toHaveBeenCalled();
      sm.stop();
    });

    it("WHEN REINITIALIZE is received THEN it transitions to initializingDeviceContext", () => {
      const { sm, listeners } = createSM({ job: () => throwError(() => new Error("fail")) });
      driveToExecution(sm);
      expect(lastExecutorState(listeners)?.type).toBe("executingIntentError");

      sm.reinitialize();
      expect(lastExecutorState(listeners)).toEqual({ type: "initializingDeviceContext" });
      sm.stop();
    });
  });

  describe("GIVEN the machine is in idle state", () => {
    it("WHEN SET_INTENT is received THEN it transitions to executingIntent", () => {
      const { sm, listeners } = createSM({ job: () => of({ step: "done" as const }) });
      driveToExecution(sm);
      expect(lastExecutorState(listeners)).toEqual({ type: "idle" });

      const newIntent = makeIntent(() => NEVER);
      sm.setIntent(newIntent);
      expect(lastExecutorState(listeners)).toEqual({ type: "executingIntent" });
      sm.stop();
    });

    it("WHEN REINITIALIZE is received THEN it transitions to initializingDeviceContext", () => {
      const { sm, listeners } = createSM({ job: () => of({ step: "done" as const }) });
      driveToExecution(sm);
      expect(lastExecutorState(listeners)).toEqual({ type: "idle" });

      sm.reinitialize();
      expect(lastExecutorState(listeners)).toEqual({ type: "initializingDeviceContext" });
      sm.stop();
    });

    it("WHEN DEVICE_DISCONNECTED is received THEN it transitions to connectingDeviceError", () => {
      const { sm, listeners } = createSM({ job: () => of({ step: "done" as const }) });
      driveToExecution(sm);
      expect(lastExecutorState(listeners)).toEqual({ type: "idle" });

      sm.deviceDisconnected();
      expect(lastExecutorState(listeners)).toEqual({
        type: "connectingDeviceError",
        error: null,
      });
      sm.stop();
    });
  });

  describe("end-to-end: happy path", () => {
    it("GIVEN a fresh machine WHEN connect, init, execute, complete THEN it goes through all phases to idle", async () => {
      const subject = new Subject<TestJobState>();
      const intent = makeIntent(() => subject.asObservable());
      const { sm, listeners } = createSM({ intent });

      expect(lastExecutorState(listeners)).toEqual({ type: "connectingDevice" });

      sm.deviceConnected(makeConnectionResult());
      expect(lastExecutorState(listeners)).toEqual({ type: "initializingDeviceContext" });

      sm.deviceContextInitialized(makeExtractedContext());
      expect(lastExecutorState(listeners)).toEqual({ type: "executingIntent" });

      subject.next({ step: "running" });
      await flushMicrotasks();
      expect(listeners.onIntentJobStateChanged).toHaveBeenCalledWith(intent, { step: "running" });

      subject.next({ step: "done" });
      await flushMicrotasks();
      expect(listeners.onIntentJobStateChanged).toHaveBeenCalledWith(intent, { step: "done" });

      subject.complete();
      await flushMicrotasks();
      expect(listeners.onIntentJobComplete).toHaveBeenCalledWith(intent);
      expect(lastExecutorState(listeners)).toEqual({ type: "idle" });

      sm.stop();
    });
  });

  describe("end-to-end: listener state sequence", () => {
    it("GIVEN a synchronous job WHEN driven to completion THEN the executor state sequence is correct", () => {
      const { sm, listeners } = createSM({ job: () => of({ step: "done" as const }) });
      sm.deviceConnected(makeConnectionResult());
      sm.deviceContextInitialized(makeExtractedContext());

      const types = listeners.executorStates.map(s => s.type);
      expect(types).toEqual([
        "connectingDevice",
        "initializingDeviceContext",
        "executingIntent",
        "idle",
      ]);
      sm.stop();
    });
  });

  describe("end-to-end: advanced paths", () => {
    it("GIVEN intent A completes WHEN intent B is set from idle THEN both complete sequentially", () => {
      const intentA = makeIntent(() => of("a-done"));
      const intentB = makeIntent(() => of("b-done"));
      const { sm, listeners } = createSM({ intent: intentA });

      driveToExecution(sm);
      expect(listeners.onIntentJobComplete).toHaveBeenCalledWith(intentA);
      expect(lastExecutorState(listeners)).toEqual({ type: "idle" });

      sm.setIntent(intentB);
      expect(listeners.onIntentJobComplete).toHaveBeenCalledWith(intentB);
      expect(lastExecutorState(listeners)).toEqual({ type: "idle" });

      const types = listeners.executorStates.map(s => s.type);
      expect(types).toEqual([
        "connectingDevice",
        "initializingDeviceContext",
        "executingIntent",
        "idle",
        "executingIntent",
        "idle",
      ]);
      sm.stop();
    });

    it("GIVEN idle after intent A WHEN device initialization params change then intent B is set during init THEN intent B executes after re-initialization", () => {
      const intentA = makeIntent(() => of("a-done"));
      const intentB = makeIntent(() => of("b-done"));
      const { sm, listeners } = createSM({ intent: intentA });

      driveToExecution(sm);
      expect(lastExecutorState(listeners)).toEqual({ type: "idle" });
      expect(listeners.onIntentJobComplete).toHaveBeenCalledWith(intentA);

      sm.reinitialize();
      expect(lastExecutorState(listeners)).toEqual({ type: "initializingDeviceContext" });

      sm.setIntent(intentB);
      expect(lastExecutorState(listeners)).toEqual({ type: "initializingDeviceContext" });

      sm.deviceContextInitialized(makeExtractedContext());
      expect(lastExecutorState(listeners)).toEqual({ type: "idle" });
      expect(listeners.onIntentJobComplete).toHaveBeenCalledWith(intentB);
      sm.stop();
    });

    it("GIVEN executing WHEN device disconnects THEN retry reconnects and re-executes the job", () => {
      let callCount = 0;
      const jobFn = () => {
        callCount++;
        if (callCount === 1) return NEVER;
        return of("recovered");
      };
      const { sm, listeners } = createSM({ job: jobFn });

      driveToExecution(sm);
      expect(lastExecutorState(listeners)).toEqual({ type: "executingIntent" });

      sm.deviceDisconnected();
      expect(lastExecutorState(listeners)).toEqual({
        type: "connectingDeviceError",
        error: null,
      });

      sm.retry();
      expect(lastExecutorState(listeners)).toEqual({ type: "connectingDevice" });

      sm.deviceConnected(makeConnectionResult("session-2"));
      expect(lastExecutorState(listeners)).toEqual({ type: "initializingDeviceContext" });

      sm.deviceContextInitialized(makeExtractedContext());
      expect(lastExecutorState(listeners)).toEqual({ type: "idle" });
      expect(listeners.onIntentJobComplete).toHaveBeenCalled();
      sm.stop();
    });

    it("GIVEN initializing WHEN intent changes THEN the new intent executes after initialization completes", () => {
      const intentA = makeIntent(() => of("a-done"));
      const intentB = makeIntent(() => of("b-done"));
      const { sm, listeners } = createSM({ intent: intentA });

      sm.deviceConnected(makeConnectionResult());
      expect(lastExecutorState(listeners)).toEqual({ type: "initializingDeviceContext" });

      sm.setIntent(intentB);
      expect(lastExecutorState(listeners)).toEqual({ type: "initializingDeviceContext" });

      sm.deviceContextInitialized(makeExtractedContext());

      expect(listeners.onIntentJobComplete).toHaveBeenCalledWith(intentB);
      expect(listeners.onIntentJobComplete).not.toHaveBeenCalledWith(intentA);
      expect(lastExecutorState(listeners)).toEqual({ type: "idle" });
      sm.stop();
    });
  });

  describe("intent-level listeners", () => {
    it("WHEN the job emits THEN intent.onJobStateChanged fires before the executor listener", async () => {
      const callOrder: string[] = [];
      const subject = new Subject<TestJobState>();
      const intent = makeBaseIntent({
        job: () => subject.asObservable(),
        onJobStateChanged: () => callOrder.push("intent"),
      });
      const listeners = makeListeners();
      (listeners.onIntentJobStateChanged as jest.Mock).mockImplementation(() =>
        callOrder.push("executor"),
      );
      const { sm } = createSM({ intent, listeners });
      driveToExecution(sm);

      subject.next({ step: "running" });
      await flushMicrotasks();

      expect(callOrder).toEqual(["intent", "executor"]);
      expect(intent.onJobStateChanged).toBeDefined();
      sm.stop();
    });

    it("WHEN the job completes THEN intent.onJobComplete fires before the executor listener", () => {
      const callOrder: string[] = [];
      const intent = makeBaseIntent({
        job: () => of({ step: "done" as const }),
        onJobComplete: () => callOrder.push("intent"),
      });
      const listeners = makeListeners();
      (listeners.onIntentJobComplete as jest.Mock).mockImplementation(() =>
        callOrder.push("executor"),
      );
      const { sm } = createSM({ intent, listeners });
      driveToExecution(sm);

      expect(callOrder).toEqual(["intent", "executor"]);
      sm.stop();
    });

    it("WHEN the job errors THEN intent.onJobError fires before the executor listener", () => {
      const callOrder: string[] = [];
      const jobError = new Error("boom");
      const intent = makeBaseIntent({
        job: () => throwError(() => jobError),
        onJobError: () => callOrder.push("intent"),
      });
      const listeners = makeListeners();
      (listeners.onIntentJobError as jest.Mock).mockImplementation(() =>
        callOrder.push("executor"),
      );
      const { sm } = createSM({ intent, listeners });
      driveToExecution(sm);

      expect(callOrder).toEqual(["intent", "executor"]);
      sm.stop();
    });

    it("WHEN no intent-level listeners are set THEN only executor listeners fire without error", async () => {
      const subject = new Subject<TestJobState>();
      const intent = makeBaseIntent({ job: () => subject.asObservable() });
      expect(intent.onJobStateChanged).toBeUndefined();
      expect(intent.onJobComplete).toBeUndefined();
      expect(intent.onJobError).toBeUndefined();

      const { sm, listeners } = createSM({ intent });
      driveToExecution(sm);

      subject.next({ step: "running" });
      await flushMicrotasks();
      expect(listeners.onIntentJobStateChanged).toHaveBeenCalled();

      subject.complete();
      await flushMicrotasks();
      expect(listeners.onIntentJobComplete).toHaveBeenCalledWith(intent);
      sm.stop();
    });

    it("WHEN intent.onJobStateChanged is set THEN it receives the jobState value", async () => {
      const onJobStateChanged = jest.fn();
      const subject = new Subject<TestJobState>();
      const intent = makeBaseIntent({
        job: () => subject.asObservable(),
        onJobStateChanged,
      });
      const { sm } = createSM({ intent });
      driveToExecution(sm);

      subject.next({ step: "running" });
      await flushMicrotasks();
      expect(onJobStateChanged).toHaveBeenCalledWith({ step: "running" });

      subject.next({ step: "done" });
      await flushMicrotasks();
      expect(onJobStateChanged).toHaveBeenCalledWith({ step: "done" });
      sm.stop();
    });

    it("WHEN intent.onJobError is set THEN it receives the error value", () => {
      const onJobError = jest.fn();
      const jobError = new Error("fail");
      const intent = makeBaseIntent({
        job: () => throwError(() => jobError),
        onJobError,
      });
      const { sm } = createSM({ intent });
      driveToExecution(sm);
      expect(onJobError).toHaveBeenCalledWith(jobError);
      sm.stop();
    });
  });
});
