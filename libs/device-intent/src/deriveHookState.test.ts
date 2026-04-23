import type { ExecutorState } from "./executor";
import { deriveHookState, type DeriveHookStateParams } from "./deriveHookState";
import { defaultRequiredContext, makeConnectionResult } from "./__tests__/test-utils";

const noop = () => {};

const defaultConnectionResult = makeConnectionResult();

const DummyComponent = () => null;

function makeParams(
  overrides: Partial<DeriveHookStateParams<unknown, unknown>> = {},
): DeriveHookStateParams<unknown, unknown> {
  return {
    deviceConnectionParams: { acceptedDeviceModelIds: [] },
    requiredDeviceContext: defaultRequiredContext,
    connectionResult: defaultConnectionResult,
    latestJobState: undefined,
    intentComponent: DummyComponent,
    intentComponentExtraProps: undefined,
    lastIntentSnapshot: null,
    onConnected: noop,
    onConnectionError: noop,
    onContextInitialized: noop,
    onInitializationError: noop,
    onRetry: noop,
    onUserCancel: noop,
    ...overrides,
  };
}

describe("deriveHookState", () => {
  it("maps connectingDevice to deviceConnection phase with correct params", () => {
    const onConnected = jest.fn();
    const onConnectionError = jest.fn();
    const deviceConnectionParams = { acceptedDeviceModelIds: [] };
    const params = makeParams({ deviceConnectionParams, onConnected, onConnectionError });
    const state: ExecutorState = { type: "connectingDevice" };

    const result = deriveHookState(state, params);

    expect(result).toEqual({
      phase: "deviceConnection",
      deviceConnectionParams,
      onConnected,
      onError: onConnectionError,
    });
  });

  it("maps connectingDeviceError to connectionError phase with error and onRetry", () => {
    const onRetry = jest.fn();
    const error = new Error("connection failed");
    const params = makeParams({ onRetry });
    const state: ExecutorState = { type: "connectingDeviceError", error };

    const result = deriveHookState(state, params);

    expect(result).toEqual({
      phase: "connectionError",
      error,
      onRetry,
    });
  });

  it("maps initializingDeviceContext to deviceInitialization phase with connectionResult", () => {
    const onContextInitialized = jest.fn();
    const onInitializationError = jest.fn();
    const params = makeParams({
      connectionResult: defaultConnectionResult,
      requiredDeviceContext: defaultRequiredContext,
      onContextInitialized,
      onInitializationError,
    });
    const state: ExecutorState = { type: "initializingDeviceContext" };

    const result = deriveHookState(state, params);

    expect(result).toEqual({
      phase: "deviceInitialization",
      connectionResult: defaultConnectionResult,
      requiredDeviceContext: defaultRequiredContext,
      onContextInitialized,
      onError: onInitializationError,
    });
  });

  it("maps initializingDeviceContextError to initializationError phase", () => {
    const onRetry = jest.fn();
    const error = new Error("init failed");
    const params = makeParams({ onRetry });
    const state: ExecutorState = { type: "initializingDeviceContextError", error };

    const result = deriveHookState(state, params);

    expect(result).toEqual({
      phase: "initializationError",
      error,
      onRetry,
    });
  });

  it("maps executingIntent to intentExecution phase with component and jobState", () => {
    const latestJobState = { step: "running" };
    const intentComponentExtraProps = { foo: "bar" };
    const params = makeParams({
      latestJobState,
      intentComponent: DummyComponent,
      intentComponentExtraProps,
    });
    const state: ExecutorState = { type: "executingIntent" };

    const result = deriveHookState(state, params);

    expect(result).toEqual({
      phase: "intentExecution",
      intentComponent: DummyComponent,
      jobState: latestJobState,
      intentComponentExtraProps,
    });
  });

  it("maps executingIntent with undefined jobState when no emission yet", () => {
    const params = makeParams({ latestJobState: undefined });
    const state: ExecutorState = { type: "executingIntent" };

    const result = deriveHookState(state, params);

    expect(result).toMatchObject({
      phase: "intentExecution",
      jobState: undefined,
    });
  });

  it("maps executingIntentError to intentError phase", () => {
    const onRetry = jest.fn();
    const error = new Error("job failed");
    const params = makeParams({ onRetry });
    const state: ExecutorState = { type: "executingIntentError", error };

    const result = deriveHookState(state, params);

    expect(result).toEqual({
      phase: "intentError",
      error,
      onRetry,
    });
  });

  it("maps invalidOperation to invalidOperation phase", () => {
    const onUserCancel = jest.fn();
    const error = new Error("invalid operation");
    const params = makeParams({ onUserCancel });
    const state: ExecutorState = { type: "invalidOperation", error };

    const result = deriveHookState(state, params);

    expect(result).toEqual({
      phase: "invalidOperation",
      error,
      onClose: onUserCancel,
    });
  });

  it("maps idle to idle phase with null lastIntentSnapshot when no intent was executed", () => {
    const params = makeParams();
    const state: ExecutorState = { type: "idle" };

    const result = deriveHookState(state, params);

    expect(result).toEqual({ phase: "idle", lastIntentSnapshot: null });
  });

  it("maps idle to idle phase with lastIntentSnapshot when provided", () => {
    const snapshot = {
      intentComponent: DummyComponent,
      jobState: "final-state",
      intentComponentExtraProps: { extra: true },
    };
    const params = makeParams({ lastIntentSnapshot: snapshot });
    const state: ExecutorState = { type: "idle" };

    const result = deriveHookState(state, params);

    expect(result).toEqual({ phase: "idle", lastIntentSnapshot: snapshot });
  });
});
