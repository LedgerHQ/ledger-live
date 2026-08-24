/**
 * @jest-environment jsdom
 */

/**
 * Tests for useDeviceIntentExecutor — the React hook that manages the
 * device-intent executor state machine (SM) and derives render-ready state.
 *
 * ## Test strategy
 *
 * **Integration smoke tests (real StateMachine)**
 * Drive the hook through its full lifecycle using the real SM, verifying
 * end-to-end phase transitions and observable behavior at a smoke level:
 *   - Phase transitions: connection → initialization → execution → idle
 *   - Error / retry flows (connection and intent errors)
 *   - Job emission, completion, and the lastIntentSnapshot contract
 *   - Device disconnection detection and re-connection
 *   - Prop-change reactivity (intent, deviceInitializationInput, cancelIntentRequestId)
 *   - enabled toggling (creates / destroys the SM)
 *   - Callback identity stability across re-renders
 *
 * **Unit tests (mocked SM)**
 * Replace the SM with a mock class to verify the hook's internal wiring
 * in isolation from the SM logic:
 *   - SM lifecycle: construction params, stop() on disable / unmount
 *   - Hook callbacks → SM methods forwarding (each callback → correct method)
 *   - SM listeners → internal state side-effects (jobState reset, live updates, snapshot tracking)
 *   - SM listeners → prop callback forwarding (onExecutorStateChanged, onIntentJob*)
 *   - Props → SM actions: change-detection, dispatch ordering (context before intent)
 *   - cancelIntentRequestId edge cases (idempotency, re-trigger)
 *   - Device session subscription lifecycle (create, swap, cleanup)
 */

import { act, renderHook } from "@testing-library/react";
import { NEVER, Subject, of, throwError } from "rxjs";
import type { DeviceConnectionResult } from "./core";
import type {
  DeviceIntentExecutorStateMachine,
  StateMachineListeners,
} from "./DeviceIntentExecutorStateMachine";
import type { DeviceIntentExecutorProps } from "./executor";
import {
  useDeviceIntentExecutor,
  type DeviceIntentExecutorHookState,
} from "./useDeviceIntentExecutor";
import {
  defaultDeviceInitializationInput,
  makeDeviceInitializationInput,
  makeExtractedContext,
  makeConnectionResult as makeBaseConnectionResult,
  makeIntent as makeBaseIntent,
  flushMicrotasks,
  type MockDeviceInitializationInput,
} from "./__tests__/test-utils";

// ---- Mocks ----

jest.mock("@ledgerhq/device-management-kit", () => ({
  DeviceStatus: { NOT_CONNECTED: "not-connected" },
}));

// ---- Test helpers ----

const intentComponent = ({ jobState }: { jobState: unknown }) => (
  <div data-testid="intent-component">{String(jobState)}</div>
);

const makeIntent = (job: () => import("rxjs").Observable<unknown> = () => NEVER) =>
  makeBaseIntent({ job, component: intentComponent });

const makeConnectionResult = (
  sessionId = "session-1",
): DeviceConnectionResult & { _sessionStateSubject: Subject<{ deviceStatus: string }> } => {
  const sessionStateSubject = new Subject<{ deviceStatus: string }>();
  return {
    ...makeBaseConnectionResult(sessionId),
    dmk: {
      getDeviceSessionState: jest.fn(() => sessionStateSubject.asObservable()),
    } as unknown as DeviceConnectionResult["dmk"],
    _sessionStateSubject: sessionStateSubject,
  };
};

// Sentinel data used by tests that only care about state-machine TRANSITIONS,
// not the payload carried by the new ExecutorState variants. These tests stub
// the SM, so the values just need to exist to satisfy the union.
const TEST_CONNECTION_RESULT = makeBaseConnectionResult();
const TEST_EXTRACTED_CONTEXT = makeExtractedContext();
const TEST_DEVICE = TEST_CONNECTION_RESULT.connectedDevice;

type TestProps = DeviceIntentExecutorProps<
  unknown,
  unknown,
  unknown,
  MockDeviceInitializationInput
>;

function makeProps(overrides: Partial<TestProps> = {}): TestProps {
  return {
    deviceConnectionParams: { acceptedDeviceModelIds: [] },
    deviceInitializationInput: defaultDeviceInitializationInput,
    onExecutorStateChanged: jest.fn(),
    intent: makeIntent(),
    intentComponentExtraProps: undefined,
    onIntentJobStateChanged: jest.fn(),
    onIntentJobComplete: jest.fn(),
    onIntentJobError: jest.fn(),
    enabled: true,
    onUserCancel: jest.fn(),
    cancelIntentRequestId: undefined,
    ...overrides,
  };
}

type HookState = DeviceIntentExecutorHookState<
  unknown,
  unknown,
  unknown,
  MockDeviceInitializationInput
> | null;

/**
 * Narrow `result.current` to a specific phase, failing the test early if the
 * phase doesn't match (safer than a bare `as` cast).
 */
function inPhase<P extends NonNullable<HookState>["phase"]>(
  state: HookState,
  phase: P,
): Extract<NonNullable<HookState>, { phase: P }> {
  expect(state).not.toBeNull();
  expect((state as NonNullable<HookState>).phase).toBe(phase);
  return state as Extract<NonNullable<HookState>, { phase: P }>;
}

function renderIntegration(overrides: Partial<TestProps> = {}) {
  const props = makeProps(overrides);
  return {
    ...renderHook(({ p }: { p: TestProps }) => useDeviceIntentExecutor(p), {
      initialProps: { p: props },
    }),
    props,
  };
}

// ---- Tests ----

describe("useDeviceIntentExecutor — integration smoke tests (real SM)", () => {
  describe("GIVEN enabled is true", () => {
    it("THEN the hook returns phase deviceConnection on mount", () => {
      const { result } = renderIntegration();
      expect(result.current).not.toBeNull();
      expect(result.current!.phase).toBe("deviceConnection");
    });

    it("THEN onExecutorStateChanged is called with connectingDevice", () => {
      const { props } = renderIntegration();
      expect(props.onExecutorStateChanged).toHaveBeenCalledWith({ type: "connectingDevice" });
    });
  });

  describe("GIVEN enabled is false", () => {
    it("THEN the hook returns null", () => {
      const { result } = renderIntegration({ enabled: false });
      expect(result.current).toBeNull();
    });
  });

  describe("GIVEN the hook is in deviceConnection phase", () => {
    it("WHEN onConnected is called THEN it transitions to deviceInitialization", () => {
      const { result } = renderIntegration();
      const state = inPhase(result.current, "deviceConnection");

      const connectionResult = makeConnectionResult();
      act(() => state.onConnected(connectionResult));

      inPhase(result.current, "deviceInitialization");
    });
  });

  describe("GIVEN the hook is in deviceDisconnected phase", () => {
    it("WHEN onRetry is called THEN it transitions back to deviceConnection", () => {
      const { result } = renderIntegration({ intent: makeIntent(() => NEVER) });

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });
      inPhase(result.current, "deviceInitialization");

      act(() => {
        connectionResult._sessionStateSubject.next({ deviceStatus: "not-connected" });
      });
      inPhase(result.current, "deviceDisconnected");

      act(() => {
        inPhase(result.current, "deviceDisconnected").onRetry();
      });
      inPhase(result.current, "deviceConnection");
    });
  });

  describe("GIVEN the hook is in deviceInitialization phase", () => {
    it("WHEN onContextInitialized is called THEN it transitions to intentExecution", () => {
      const { result } = renderIntegration({ intent: makeIntent(() => NEVER) });

      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(makeConnectionResult());
      });
      inPhase(result.current, "deviceInitialization");

      act(() => {
        inPhase(result.current, "deviceInitialization").onContextInitialized(
          makeExtractedContext(),
        );
      });
      inPhase(result.current, "intentExecution");
    });
  });

  describe("GIVEN the hook is in intentExecution phase", () => {
    function driveToExecution(overrides: Partial<TestProps> = {}) {
      const integration = renderIntegration(overrides);
      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(integration.result.current, "deviceConnection").onConnected(connectionResult);
      });
      act(() => {
        inPhase(integration.result.current, "deviceInitialization").onContextInitialized(
          makeExtractedContext(),
        );
      });
      return { ...integration, connectionResult };
    }

    it("THEN intentComponent and intentComponentExtraProps are provided", () => {
      const intent = makeIntent(() => NEVER);
      const { result } = driveToExecution({ intent, intentComponentExtraProps: { foo: "bar" } });

      const state = inPhase(result.current, "intentExecution");
      expect(state.intentComponent).toBe(intent.component);
      expect(state.intentComponentExtraProps).toEqual({ foo: "bar" });
    });

    it("WHEN the job emits THEN jobState is updated and onIntentJobStateChanged is called", async () => {
      const subject = new Subject<unknown>();
      const { result, props } = driveToExecution({
        intent: makeIntent(() => subject.asObservable()),
      });

      await act(async () => {
        subject.next({ step: "running" });
        await flushMicrotasks();
      });

      const state = inPhase(result.current, "intentExecution");
      expect(state.jobState).toEqual({ step: "running" });
      expect(props.onIntentJobStateChanged).toHaveBeenCalledWith({ step: "running" });
    });

    it("WHEN the job completes THEN it transitions to idle and onIntentJobComplete is called", async () => {
      const { result, props } = driveToExecution({ intent: makeIntent(() => of("done")) });

      await act(async () => {
        await flushMicrotasks();
      });

      inPhase(result.current, "idle");
      expect(props.onIntentJobComplete).toHaveBeenCalled();
    });

    it("WHEN the job completes THEN idle includes lastIntentSnapshot with the last job state", async () => {
      const intent = makeIntent(() => of("final-state"));
      const { result } = driveToExecution({ intent, intentComponentExtraProps: { extra: 42 } });

      await act(async () => {
        await flushMicrotasks();
      });

      const state = inPhase(result.current, "idle");
      expect(state.lastIntentSnapshot).not.toBeNull();
      expect(state.lastIntentSnapshot!.intentComponent).toBe(intent.component);
      expect(state.lastIntentSnapshot!.jobState).toBe("final-state");
      expect(state.lastIntentSnapshot!.intentComponentExtraProps).toEqual({ extra: 42 });
    });

    it("WHEN jobState is undefined before first emission THEN intentExecution reflects undefined", () => {
      const { result } = driveToExecution({ intent: makeIntent(() => NEVER) });

      const state = inPhase(result.current, "intentExecution");
      expect(state.jobState).toBeUndefined();
    });

    it("WHEN the job errors THEN it transitions to intentError and onIntentJobError is called", () => {
      const jobError = new Error("job failed");
      const { result, props } = driveToExecution({
        intent: makeIntent(() => throwError(() => jobError)),
      });

      const state = inPhase(result.current, "intentError");
      expect(state.error).toBe(jobError);
      expect(props.onIntentJobError).toHaveBeenCalledWith(jobError);
    });

    it("WHEN the device disconnects THEN it transitions to deviceDisconnected", () => {
      const { result, connectionResult } = driveToExecution({
        intent: makeIntent(() => NEVER),
      });

      act(() => {
        connectionResult._sessionStateSubject.next({ deviceStatus: "not-connected" });
      });

      inPhase(result.current, "deviceDisconnected");
    });
  });

  describe("GIVEN the hook is in intentError phase", () => {
    it("WHEN onRetry is called THEN the job is re-invoked and it transitions to intentExecution", () => {
      let callCount = 0;
      const jobFn = () => {
        callCount++;
        if (callCount === 1) return throwError(() => new Error("first call fails"));
        return NEVER;
      };
      const { result } = renderIntegration({ intent: makeIntent(jobFn) });

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });
      act(() => {
        inPhase(result.current, "deviceInitialization").onContextInitialized(
          makeExtractedContext(),
        );
      });
      inPhase(result.current, "intentError");

      act(() => {
        inPhase(result.current, "intentError").onRetry();
      });
      inPhase(result.current, "intentExecution");
    });
  });

  describe("device disconnection monitoring", () => {
    it("WHEN the device emits NOT_CONNECTED THEN the hook transitions to deviceDisconnected", () => {
      const { result } = renderIntegration({ intent: makeIntent(() => NEVER) });

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });
      inPhase(result.current, "deviceInitialization");

      act(() => {
        connectionResult._sessionStateSubject.next({ deviceStatus: "not-connected" });
      });

      inPhase(result.current, "deviceDisconnected");
    });

    it("WHEN the device disconnects and reconnects THEN a new subscription is made", () => {
      const { result } = renderIntegration({ intent: makeIntent(() => NEVER) });

      const connectionResult1 = makeConnectionResult("session-1");
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult1);
      });
      expect(connectionResult1.dmk.getDeviceSessionState).toHaveBeenCalledWith({
        sessionId: "session-1",
      });

      act(() => {
        connectionResult1._sessionStateSubject.next({ deviceStatus: "not-connected" });
      });
      inPhase(result.current, "deviceDisconnected");

      act(() => {
        inPhase(result.current, "deviceDisconnected").onRetry();
      });

      const connectionResult2 = makeConnectionResult("session-2");
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult2);
      });
      expect(connectionResult2.dmk.getDeviceSessionState).toHaveBeenCalledWith({
        sessionId: "session-2",
      });
    });
  });

  describe("props -> SM actions (happy paths)", () => {
    it("WHEN intent changes from idle THEN it transitions to intentExecution", () => {
      const { result, rerender, props } = renderIntegration({
        intent: makeIntent(() => of("done")),
      });

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });
      act(() => {
        inPhase(result.current, "deviceInitialization").onContextInitialized(
          makeExtractedContext(),
        );
      });
      inPhase(result.current, "idle");

      const newIntent = makeIntent(() => NEVER);
      rerender({ p: { ...props, intent: newIntent } });

      inPhase(result.current, "intentExecution");
    });

    it("WHEN intent changes from idle THEN jobState is reset to undefined (not stale from previous intent)", () => {
      const { result, rerender, props } = renderIntegration({
        intent: makeIntent(() => of("old-state")),
      });

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });
      act(() => {
        inPhase(result.current, "deviceInitialization").onContextInitialized(
          makeExtractedContext(),
        );
      });
      inPhase(result.current, "idle");

      const newIntent = makeIntent(() => NEVER);
      rerender({ p: { ...props, intent: newIntent } });

      const state = inPhase(result.current, "intentExecution");
      expect(state.jobState).toBeUndefined();
    });

    it("WHEN deviceInitializationInput changes from idle THEN it transitions to deviceInitialization", () => {
      const { result, rerender, props } = renderIntegration({
        intent: makeIntent(() => of("done")),
      });

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });
      act(() => {
        inPhase(result.current, "deviceInitialization").onContextInitialized(
          makeExtractedContext(),
        );
      });
      inPhase(result.current, "idle");

      const newDeviceInitializationInput = makeDeviceInitializationInput({ appName: "Bitcoin" });
      rerender({ p: { ...props, deviceInitializationInput: newDeviceInitializationInput } });

      inPhase(result.current, "deviceInitialization");
    });

    it("WHEN both deviceInitializationInput and intent change simultaneously from idle THEN initialization input is dispatched first (transitions to deviceInitialization, not intentError)", () => {
      const { result, rerender, props } = renderIntegration({
        intent: makeIntent(() => of("done")),
      });

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });
      act(() => {
        inPhase(result.current, "deviceInitialization").onContextInitialized(
          makeExtractedContext(),
        );
      });
      inPhase(result.current, "idle");

      const newDeviceInitializationInput = makeDeviceInitializationInput({ appName: "Bitcoin" });
      const newIntent = makeIntent(() => NEVER);
      rerender({
        p: {
          ...props,
          deviceInitializationInput: newDeviceInitializationInput,
          intent: newIntent,
        },
      });

      // If context was dispatched first: idle -> deviceInitialization
      // then SET_INTENT is absorbed as a self-transition.
      // If intent was dispatched first: idle -> intentExecution (wrong context!)
      inPhase(result.current, "deviceInitialization");
    });
  });

  describe("cancelIntentRequestId", () => {
    it("WHEN cancelIntentRequestId changes to a new value THEN the intent is stopped", () => {
      const subject = new Subject<unknown>();
      const { result, rerender, props } = renderIntegration({
        intent: makeIntent(() => subject.asObservable()),
      });

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });
      act(() => {
        inPhase(result.current, "deviceInitialization").onContextInitialized(
          makeExtractedContext(),
        );
      });
      inPhase(result.current, "intentExecution");

      rerender({ p: { ...props, cancelIntentRequestId: "cancel-1" } });

      inPhase(result.current, "idle");
    });

    it("WHEN intent is cancelled THEN idle includes lastIntentSnapshot with the execution state at time of cancellation", async () => {
      const subject = new Subject<unknown>();
      const intent = makeIntent(() => subject.asObservable());
      const { result, rerender, props } = renderIntegration({
        intent,
        intentComponentExtraProps: { x: 1 },
      });

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });
      act(() => {
        inPhase(result.current, "deviceInitialization").onContextInitialized(
          makeExtractedContext(),
        );
      });

      await act(async () => {
        subject.next("in-progress");
        await flushMicrotasks();
      });

      rerender({ p: { ...props, cancelIntentRequestId: "cancel-1" } });

      const state = inPhase(result.current, "idle");
      expect(state.lastIntentSnapshot).not.toBeNull();
      expect(state.lastIntentSnapshot!.intentComponent).toBe(intent.component);
      expect(state.lastIntentSnapshot!.jobState).toBe("in-progress");
      expect(state.lastIntentSnapshot!.intentComponentExtraProps).toEqual({ x: 1 });
    });
  });

  describe("enabled toggling", () => {
    it("WHEN enabled changes from true to false THEN the hook returns null", () => {
      const { result, rerender, props } = renderIntegration();

      expect(result.current).not.toBeNull();

      rerender({ p: { ...props, enabled: false } });
      expect(result.current).toBeNull();
    });

    it("WHEN enabled changes from false to true THEN a fresh SM is created starting at deviceConnection", () => {
      const { result, rerender, props } = renderIntegration({ enabled: false });

      expect(result.current).toBeNull();

      rerender({ p: { ...props, enabled: true } });
      expect(result.current).not.toBeNull();
      inPhase(result.current, "deviceConnection");
    });

    it("WHEN enabled cycles true→false→true after reaching intentExecution THEN state resets to clean deviceConnection", async () => {
      const subject = new Subject<unknown>();
      const intent = makeIntent(() => subject.asObservable());
      const { result, rerender, props } = renderIntegration({ intent });

      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(makeConnectionResult());
      });
      act(() => {
        inPhase(result.current, "deviceInitialization").onContextInitialized(
          makeExtractedContext(),
        );
      });
      await act(async () => {
        subject.next("in-progress");
        await flushMicrotasks();
      });
      inPhase(result.current, "intentExecution");

      rerender({ p: { ...props, enabled: false } });
      expect(result.current).toBeNull();

      rerender({ p: { ...props, enabled: true } });
      const state = inPhase(result.current, "deviceConnection");
      expect(state).not.toHaveProperty("connectionResult");
      expect(state).not.toHaveProperty("lastIntentSnapshot");
    });
  });

  describe("callback forwarding", () => {
    it("WHEN onExecutorStateChanged prop changes between renders THEN the latest callback is called", () => {
      const firstCallback = jest.fn();
      const secondCallback = jest.fn();
      const { result, rerender, props } = renderIntegration({
        onExecutorStateChanged: firstCallback,
      });

      // First callback should have been called on mount
      expect(firstCallback).toHaveBeenCalledWith({ type: "connectingDevice" });

      // Update the callback prop
      rerender({ p: { ...props, onExecutorStateChanged: secondCallback } });

      // Trigger a transition via device disconnection from deviceInitialization
      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });
      act(() => {
        connectionResult._sessionStateSubject.next({ deviceStatus: "not-connected" });
      });

      // The second (latest) callback should be called, not the first
      expect(secondCallback).toHaveBeenCalledWith({
        type: "deviceDisconnected",
        device: connectionResult.connectedDevice,
      });
    });

    it("WHEN onUserCancel prop changes between renders THEN onClose forwards to the latest callback", () => {
      const firstCancel = jest.fn();
      const secondCancel = jest.fn();
      const { result, rerender, props } = renderIntegration({ onUserCancel: firstCancel });

      const state1 = inPhase(result.current, "deviceConnection");
      state1.onClose();
      expect(firstCancel).toHaveBeenCalledTimes(1);
      expect(secondCancel).not.toHaveBeenCalled();

      rerender({ p: { ...props, onUserCancel: secondCancel } });

      const state2 = inPhase(result.current, "deviceConnection");
      state2.onClose();
      expect(secondCancel).toHaveBeenCalledTimes(1);
      expect(firstCancel).toHaveBeenCalledTimes(1);
    });
  });
});

// ---- Unit tests (mocked SM) ---- //

type MockSM = jest.Mocked<DeviceIntentExecutorStateMachine<unknown, unknown, unknown>>;

type MockSMClass = jest.Mock & {
  lastInstance: MockSM | null;
  lastListeners: StateMachineListeners<unknown, unknown, unknown> | null;
};

function renderWithMockSM(overrides: Partial<TestProps> = {}) {
  const SMClass: MockSMClass = jest.fn().mockImplementation(function (
    this: DeviceIntentExecutorStateMachine<unknown, unknown, unknown>,
    params: { listeners: StateMachineListeners<unknown, unknown, unknown> },
  ) {
    const mock: MockSM = {
      start: jest.fn(),
      deviceConnected: jest.fn(),
      deviceContextInitialized: jest.fn(),
      deviceDisconnected: jest.fn(),
      retry: jest.fn(),
      setIntent: jest.fn(),
      reinitialize: jest.fn(),
      stopIntent: jest.fn(),
      stop: jest.fn(),
    };
    SMClass.lastInstance = mock;
    SMClass.lastListeners = params.listeners;
    Object.assign(this, mock);
  }) as unknown as MockSMClass;
  SMClass.lastInstance = null;
  SMClass.lastListeners = null;

  const props = makeProps(overrides);
  const hookRef = renderHook(
    ({ p }: { p: TestProps }) => useDeviceIntentExecutor(p, { StateMachineClass: SMClass }),
    { initialProps: { p: props } },
  );

  return {
    ...hookRef,
    SMClass,
    props,
    get sm() {
      return SMClass.lastInstance!;
    },
    get listeners() {
      return SMClass.lastListeners!;
    },
  };
}

describe("useDeviceIntentExecutor — unit (mocked SM)", () => {
  describe("SM lifecycle", () => {
    it("WHEN enabled is true THEN the SM is constructed with the correct params", () => {
      const { SMClass, props } = renderWithMockSM();

      expect(SMClass).toHaveBeenCalledTimes(1);
      expect(SMClass).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceConnectionParams: props.deviceConnectionParams,
          intent: props.intent,
          listeners: expect.any(Object),
        }),
      );
    });

    it("WHEN enabled is true THEN the SM is started", () => {
      // WHEN
      const { sm } = renderWithMockSM();

      // THEN
      expect(sm.start).toHaveBeenCalledTimes(1);
    });

    it("WHEN enabled is false THEN no SM is constructed", () => {
      const { SMClass } = renderWithMockSM({ enabled: false });

      expect(SMClass).not.toHaveBeenCalled();
    });

    it("WHEN enabled transitions from true to false THEN sm.stop() is called", () => {
      const { rerender, sm, props } = renderWithMockSM();

      const instance = sm;
      expect(instance.stop).not.toHaveBeenCalled();

      rerender({ p: { ...props, enabled: false } });
      expect(instance.stop).toHaveBeenCalled();
    });

    it("WHEN enabled transitions from false to true THEN a new SM is constructed", () => {
      const { rerender, SMClass, props } = renderWithMockSM({ enabled: false });

      expect(SMClass).not.toHaveBeenCalled();

      rerender({ p: { ...props, enabled: true } });
      expect(SMClass).toHaveBeenCalledTimes(1);
      expect(SMClass.lastInstance?.start).toHaveBeenCalledTimes(1);
    });

    it("WHEN the hook unmounts THEN sm.stop() is called", () => {
      const { unmount, sm } = renderWithMockSM();

      const instance = sm;
      expect(instance.stop).not.toHaveBeenCalled();

      unmount();
      expect(instance.stop).toHaveBeenCalled();
    });
  });

  describe("callback forwarding to SM", () => {
    it("WHEN onConnected is called THEN sm.deviceConnected is called with the connection result", () => {
      const { result, sm } = renderWithMockSM();

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });

      expect(sm.deviceConnected).toHaveBeenCalledWith(connectionResult);
    });

    it("WHEN onContextInitialized is called THEN sm.deviceContextInitialized is called", () => {
      const { result, sm, listeners } = renderWithMockSM();

      act(() => {
        const connectionResult = makeConnectionResult();
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
        listeners.onExecutorStateChanged({
          type: "initializingDeviceContext",
          connectionResult: TEST_CONNECTION_RESULT,
        });
      });

      const ctx = makeExtractedContext();
      act(() => {
        inPhase(result.current, "deviceInitialization").onContextInitialized(ctx);
      });

      expect(sm.deviceContextInitialized).toHaveBeenCalledWith(ctx);
    });

    it("WHEN onRetry is called THEN sm.retry is called", () => {
      const { result, sm, listeners } = renderWithMockSM();

      act(() => {
        listeners.onExecutorStateChanged({ type: "deviceDisconnected", device: TEST_DEVICE });
      });

      act(() => {
        inPhase(result.current, "deviceDisconnected").onRetry();
      });

      expect(sm.retry).toHaveBeenCalled();
    });
  });

  describe("SM listener -> internal state side effects", () => {
    it("WHEN SM emits executingIntent THEN latestJobState is reset to undefined", () => {
      const { result, listeners, props } = renderWithMockSM();

      act(() => {
        listeners.onIntentJobStateChanged(props.intent, "some-state");
      });

      act(() => {
        listeners.onExecutorStateChanged({
          type: "executingIntent",
          connectionResult: TEST_CONNECTION_RESULT,
          extractedContext: TEST_EXTRACTED_CONTEXT,
        });
      });

      const state = inPhase(result.current, "intentExecution");
      expect(state.jobState).toBeUndefined();
    });

    it("WHEN SM emits executingIntent THEN lastIntentSnapshot is initialized with the current intent component", () => {
      const intent = makeIntent(() => NEVER);
      const { result, listeners } = renderWithMockSM({
        intent,
        intentComponentExtraProps: { x: 1 },
      });

      act(() => {
        listeners.onExecutorStateChanged({
          type: "executingIntent",
          connectionResult: TEST_CONNECTION_RESULT,
          extractedContext: TEST_EXTRACTED_CONTEXT,
        });
      });

      act(() => {
        listeners.onExecutorStateChanged({ type: "idle" });
      });

      const state = inPhase(result.current, "idle");
      expect(state.lastIntentSnapshot).toEqual({
        intentComponent: intent.component,
        jobState: undefined,
        intentComponentExtraProps: { x: 1 },
      });
    });

    it("WHEN SM emits connectingDevice THEN connectionResult and latestJobState are reset", () => {
      const { result, listeners } = renderWithMockSM();

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
        listeners.onExecutorStateChanged({
          type: "initializingDeviceContext",
          connectionResult: TEST_CONNECTION_RESULT,
        });
      });

      act(() => {
        listeners.onExecutorStateChanged({ type: "connectingDevice" });
      });

      inPhase(result.current, "deviceConnection");
    });

    it("WHEN SM emits deviceDisconnected THEN connectionResult and latestJobState are reset", () => {
      const { result, listeners } = renderWithMockSM();

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
        listeners.onExecutorStateChanged({
          type: "initializingDeviceContext",
          connectionResult: TEST_CONNECTION_RESULT,
        });
      });

      act(() => {
        listeners.onExecutorStateChanged({ type: "deviceDisconnected", device: TEST_DEVICE });
      });

      inPhase(result.current, "deviceDisconnected");
    });

    it("WHEN SM emits onIntentJobStateChanged THEN lastIntentSnapshot is updated with the latest jobState", () => {
      const intent = makeIntent(() => NEVER);
      const { result, listeners } = renderWithMockSM({
        intent,
        intentComponentExtraProps: { y: 2 },
      });

      act(() => {
        listeners.onExecutorStateChanged({
          type: "executingIntent",
          connectionResult: TEST_CONNECTION_RESULT,
          extractedContext: TEST_EXTRACTED_CONTEXT,
        });
      });

      act(() => {
        listeners.onIntentJobStateChanged(intent, "step-1");
      });

      act(() => {
        listeners.onExecutorStateChanged({ type: "idle" });
      });

      const state = inPhase(result.current, "idle");
      expect(state.lastIntentSnapshot).toEqual({
        intentComponent: intent.component,
        jobState: "step-1",
        intentComponentExtraProps: { y: 2 },
      });
    });
  });

  describe("SM listener -> prop callback forwarding", () => {
    it("WHEN SM emits onExecutorStateChanged THEN the prop callback is forwarded", () => {
      const { listeners, props } = renderWithMockSM();

      act(() => {
        listeners.onExecutorStateChanged({ type: "connectingDevice" });
      });

      expect(props.onExecutorStateChanged).toHaveBeenCalledWith({ type: "connectingDevice" });
    });

    it("WHEN SM emits onIntentJobStateChanged THEN the prop callback is forwarded", () => {
      const { listeners, props } = renderWithMockSM();

      act(() => {
        listeners.onIntentJobStateChanged(props.intent, { step: "running" });
      });

      expect(props.onIntentJobStateChanged).toHaveBeenCalledWith({ step: "running" });
    });

    it("WHEN SM emits onIntentJobComplete THEN the prop callback is forwarded", () => {
      const { listeners, props } = renderWithMockSM();

      act(() => {
        listeners.onIntentJobComplete(props.intent);
      });

      expect(props.onIntentJobComplete).toHaveBeenCalled();
    });

    it("WHEN SM emits onIntentJobError THEN the prop callback is forwarded", () => {
      const { listeners, props } = renderWithMockSM();

      const error = new Error("job failed");
      act(() => {
        listeners.onIntentJobError(props.intent, error);
      });

      expect(props.onIntentJobError).toHaveBeenCalledWith(error);
    });

    it("WHEN prop callback changes between renders THEN the latest callback is used", () => {
      const firstCallback = jest.fn();
      const secondCallback = jest.fn();
      const { rerender, listeners, props } = renderWithMockSM({
        onExecutorStateChanged: firstCallback,
      });

      rerender({ p: { ...props, onExecutorStateChanged: secondCallback } });

      act(() => {
        listeners.onExecutorStateChanged({ type: "deviceDisconnected", device: TEST_DEVICE });
      });

      expect(secondCallback).toHaveBeenCalledWith({
        type: "deviceDisconnected",
        device: TEST_DEVICE,
      });
      expect(firstCallback).not.toHaveBeenCalledWith({
        type: "deviceDisconnected",
        device: TEST_DEVICE,
      });
    });
  });

  describe("props -> SM actions", () => {
    it("WHEN deviceInitializationInput changes THEN sm.reinitialize is called", () => {
      const { rerender, sm, props } = renderWithMockSM();

      const newDeviceInitializationInput = makeDeviceInitializationInput({ appName: "Bitcoin" });
      rerender({ p: { ...props, deviceInitializationInput: newDeviceInitializationInput } });

      expect(sm.reinitialize).toHaveBeenCalled();
    });

    it("WHEN intent changes THEN sm.setIntent is called", () => {
      const { rerender, sm, props } = renderWithMockSM();

      const newIntent = makeIntent(() => NEVER);
      rerender({ p: { ...props, intent: newIntent } });

      expect(sm.setIntent).toHaveBeenCalledWith(newIntent);
    });

    it("WHEN both initialization input and intent change THEN reinitialize is called before setIntent", () => {
      const { rerender, sm, props } = renderWithMockSM();

      const callOrder: string[] = [];
      sm.reinitialize.mockImplementation(() => {
        callOrder.push("reinitialize");
      });
      sm.setIntent.mockImplementation(() => {
        callOrder.push("setIntent");
      });

      const newDeviceInitializationInput = makeDeviceInitializationInput({ appName: "Bitcoin" });
      const newIntent = makeIntent(() => NEVER);
      rerender({
        p: {
          ...props,
          deviceInitializationInput: newDeviceInitializationInput,
          intent: newIntent,
        },
      });

      expect(callOrder).toEqual(["reinitialize", "setIntent"]);
    });

    it("WHEN neither context nor intent change THEN no SM dispatch is made", () => {
      const { rerender, sm, props } = renderWithMockSM();

      sm.reinitialize.mockClear();
      sm.setIntent.mockClear();

      rerender({ p: props });

      expect(sm.reinitialize).not.toHaveBeenCalled();
      expect(sm.setIntent).not.toHaveBeenCalled();
    });

    it("WHEN only intent changes THEN only sm.setIntent is called (not reinitialize)", () => {
      const { rerender, sm, props } = renderWithMockSM();

      sm.reinitialize.mockClear();
      const newIntent = makeIntent(() => NEVER);
      rerender({ p: { ...props, intent: newIntent } });

      expect(sm.setIntent).toHaveBeenCalledWith(newIntent);
      expect(sm.reinitialize).not.toHaveBeenCalled();
    });

    it("WHEN only initialization input changes THEN only sm.reinitialize is called (not setIntent)", () => {
      const { rerender, sm, props } = renderWithMockSM();

      sm.setIntent.mockClear();
      const newDeviceInitializationInput = makeDeviceInitializationInput({ appName: "Bitcoin" });
      rerender({ p: { ...props, deviceInitializationInput: newDeviceInitializationInput } });

      expect(sm.reinitialize).toHaveBeenCalled();
      expect(sm.setIntent).not.toHaveBeenCalled();
    });

    it("WHEN enabled is false THEN changing context or intent does not dispatch to SM", () => {
      const { rerender, SMClass, props } = renderWithMockSM({ enabled: false });

      expect(SMClass).not.toHaveBeenCalled();

      const newDeviceInitializationInput = makeDeviceInitializationInput({ appName: "Bitcoin" });
      const newIntent = makeIntent(() => NEVER);
      rerender({
        p: {
          ...props,
          deviceInitializationInput: newDeviceInitializationInput,
          intent: newIntent,
        },
      });

      expect(SMClass).not.toHaveBeenCalled();
    });
  });

  describe("cancelIntentRequestId", () => {
    it("WHEN cancelIntentRequestId changes to a new value THEN sm.stopIntent is called", () => {
      const { rerender, sm, props } = renderWithMockSM();

      rerender({ p: { ...props, cancelIntentRequestId: "cancel-1" } });

      expect(sm.stopIntent).toHaveBeenCalled();
    });

    it("WHEN cancelIntentRequestId stays the same THEN sm.stopIntent is NOT called again", () => {
      const { rerender, sm, props } = renderWithMockSM({ cancelIntentRequestId: "cancel-1" });

      sm.stopIntent.mockClear();
      rerender({ p: { ...props, cancelIntentRequestId: "cancel-1" } });

      expect(sm.stopIntent).not.toHaveBeenCalled();
    });

    it("WHEN cancelIntentRequestId is undefined from the start THEN sm.stopIntent is NOT called", () => {
      const { sm } = renderWithMockSM({ cancelIntentRequestId: undefined });

      expect(sm.stopIntent).not.toHaveBeenCalled();
    });

    it("WHEN cancelIntentRequestId changes from one value to a different value THEN sm.stopIntent is called again", () => {
      const { rerender, sm, props } = renderWithMockSM();

      rerender({ p: { ...props, cancelIntentRequestId: "cancel-1" } });
      expect(sm.stopIntent).toHaveBeenCalledTimes(1);

      rerender({ p: { ...props, cancelIntentRequestId: "cancel-2" } });
      expect(sm.stopIntent).toHaveBeenCalledTimes(2);
    });
  });

  describe("onUserCancel forwarding as onClose", () => {
    it("THEN every phase exposes onClose that calls props.onUserCancel", () => {
      const onUserCancel = jest.fn();
      const { result, listeners } = renderWithMockSM({ onUserCancel });

      inPhase(result.current, "deviceConnection").onClose();
      expect(onUserCancel).toHaveBeenCalledTimes(1);

      act(() => {
        listeners.onExecutorStateChanged({ type: "deviceDisconnected", device: TEST_DEVICE });
      });
      inPhase(result.current, "deviceDisconnected").onClose();
      expect(onUserCancel).toHaveBeenCalledTimes(2);

      act(() => {
        listeners.onExecutorStateChanged({
          type: "initializingDeviceContext",
          connectionResult: TEST_CONNECTION_RESULT,
        });
      });
      inPhase(result.current, "deviceInitialization").onClose();
      expect(onUserCancel).toHaveBeenCalledTimes(3);

      act(() => {
        listeners.onExecutorStateChanged({
          type: "executingIntent",
          connectionResult: TEST_CONNECTION_RESULT,
          extractedContext: TEST_EXTRACTED_CONTEXT,
        });
      });
      inPhase(result.current, "intentExecution").onClose();
      expect(onUserCancel).toHaveBeenCalledTimes(4);

      act(() => {
        listeners.onExecutorStateChanged({
          type: "executingIntentError",
          error: new Error("e"),
          connectionResult: TEST_CONNECTION_RESULT,
          extractedContext: TEST_EXTRACTED_CONTEXT,
        });
      });
      inPhase(result.current, "intentError").onClose();
      expect(onUserCancel).toHaveBeenCalledTimes(5);

      act(() => {
        listeners.onExecutorStateChanged({
          type: "invalidOperation",
          error: new Error("e"),
        });
      });
      inPhase(result.current, "invalidOperation").onClose();
      expect(onUserCancel).toHaveBeenCalledTimes(6);

      act(() => {
        listeners.onExecutorStateChanged({ type: "idle" });
      });
      inPhase(result.current, "idle").onClose();
      expect(onUserCancel).toHaveBeenCalledTimes(7);
    });
  });

  describe("SM listener -> live jobState update during intentExecution", () => {
    it("WHEN SM emits onIntentJobStateChanged THEN the hook returns the updated jobState in intentExecution phase", () => {
      const intent = makeIntent(() => NEVER);
      const { result, listeners } = renderWithMockSM({ intent });

      act(() => {
        listeners.onExecutorStateChanged({
          type: "executingIntent",
          connectionResult: TEST_CONNECTION_RESULT,
          extractedContext: TEST_EXTRACTED_CONTEXT,
        });
      });

      expect(inPhase(result.current, "intentExecution").jobState).toBeUndefined();

      act(() => {
        listeners.onIntentJobStateChanged(intent, "step-1");
      });

      const state = inPhase(result.current, "intentExecution");
      expect(state.jobState).toBe("step-1");
    });
  });

  describe("device disconnection monitoring", () => {
    it("WHEN the device session emits NOT_CONNECTED THEN sm.deviceDisconnected is called", () => {
      const { result, sm } = renderWithMockSM();

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });

      act(() => {
        const subject = (connectionResult as unknown as { _sessionStateSubject: Subject<unknown> })
          ._sessionStateSubject;
        subject.next({ deviceStatus: "not-connected" });
      });

      expect(sm.deviceDisconnected).toHaveBeenCalled();
    });

    it("WHEN the device session emits a status other than NOT_CONNECTED THEN sm.deviceDisconnected is NOT called", () => {
      const { result, sm } = renderWithMockSM();

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });

      act(() => {
        const subject = connectionResult._sessionStateSubject;
        subject.next({ deviceStatus: "connected" });
      });

      expect(sm.deviceDisconnected).not.toHaveBeenCalled();
    });

    it("WHEN connectionResult changes THEN the old subscription is cleaned up and a new one is created", () => {
      const { result, sm, listeners } = renderWithMockSM();

      const connectionResult1 = makeConnectionResult("session-1");
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult1);
      });
      expect(connectionResult1.dmk.getDeviceSessionState).toHaveBeenCalledWith({
        sessionId: "session-1",
      });

      act(() => {
        listeners.onExecutorStateChanged({ type: "connectingDevice" });
      });

      const connectionResult2 = makeConnectionResult("session-2");
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult2);
      });
      expect(connectionResult2.dmk.getDeviceSessionState).toHaveBeenCalledWith({
        sessionId: "session-2",
      });

      sm.deviceDisconnected.mockClear();
      act(() => {
        connectionResult1._sessionStateSubject.next({ deviceStatus: "not-connected" });
      });
      expect(sm.deviceDisconnected).not.toHaveBeenCalled();

      act(() => {
        connectionResult2._sessionStateSubject.next({ deviceStatus: "not-connected" });
      });
      expect(sm.deviceDisconnected).toHaveBeenCalled();
    });

    it("WHEN the hook unmounts with an active subscription THEN the subscription is cleaned up", () => {
      const { result, unmount, sm } = renderWithMockSM();

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });

      const smInstance = sm;
      unmount();

      act(() => {
        connectionResult._sessionStateSubject.next({ deviceStatus: "not-connected" });
      });

      expect(smInstance.deviceDisconnected).not.toHaveBeenCalled();
    });

    it("WHEN enabled goes false while a subscription is active THEN the subscription is cleaned up", () => {
      const { result, rerender, sm, props } = renderWithMockSM();

      const connectionResult = makeConnectionResult();
      act(() => {
        inPhase(result.current, "deviceConnection").onConnected(connectionResult);
      });

      expect(connectionResult._sessionStateSubject.observed).toBe(true);

      const smInstance = sm;
      smInstance.deviceDisconnected.mockClear();

      rerender({ p: { ...props, enabled: false } });

      expect(connectionResult._sessionStateSubject.observed).toBe(false);

      act(() => {
        connectionResult._sessionStateSubject.next({ deviceStatus: "not-connected" });
      });

      expect(smInstance.deviceDisconnected).not.toHaveBeenCalled();
    });
  });
});
