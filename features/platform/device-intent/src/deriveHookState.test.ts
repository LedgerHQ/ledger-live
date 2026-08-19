import type { ExecutorState } from "./executor";
import { deriveHookState, type DeriveHookStateParams } from "./deriveHookState";
import {
  defaultDeviceInitializationInput,
  makeConnectionResult,
  makeExtractedContext,
  type MockDeviceInitializationInput,
} from "./__tests__/test-utils";

const noop = () => {};

const defaultConnectionResult = makeConnectionResult();
const defaultExtractedContext = makeExtractedContext();
const defaultDevice = defaultConnectionResult.connectedDevice;

const DummyComponent = () => null;

function makeParams(
  overrides: Partial<DeriveHookStateParams<unknown, unknown, MockDeviceInitializationInput>> = {},
): DeriveHookStateParams<unknown, unknown, MockDeviceInitializationInput> {
  return {
    deviceConnectionParams: { acceptedDeviceModelIds: [] },
    deviceInitializationInput: defaultDeviceInitializationInput,
    connectionResult: defaultConnectionResult,
    latestJobState: undefined,
    intentComponent: DummyComponent,
    intentComponentExtraProps: undefined,
    lastIntentSnapshot: null,
    onConnected: noop,
    onContextInitialized: noop,
    onRetry: noop,
    onUserCancel: noop,
    ...overrides,
  };
}

describe("deriveHookState", () => {
  it("maps connectingDevice to deviceConnection phase with correct params", () => {
    const onConnected = jest.fn();
    const onUserCancel = jest.fn();
    const deviceConnectionParams = { acceptedDeviceModelIds: [] };
    const params = makeParams({
      deviceConnectionParams,
      onConnected,
      onUserCancel,
    });
    const state: ExecutorState = { type: "connectingDevice" };

    const result = deriveHookState(state, params);

    expect(result).toEqual({
      phase: "deviceConnection",
      deviceConnectionParams,
      onConnected,
      onClose: onUserCancel,
    });
  });

  it("maps deviceDisconnected to deviceDisconnected phase with device, onRetry and onClose", () => {
    const onRetry = jest.fn();
    const onUserCancel = jest.fn();
    const params = makeParams({ onRetry, onUserCancel });
    const state: ExecutorState = { type: "deviceDisconnected", device: defaultDevice };

    const result = deriveHookState(state, params);

    expect(result).toEqual({
      phase: "deviceDisconnected",
      device: defaultDevice,
      onRetry,
      onClose: onUserCancel,
    });
  });

  it("maps initializingDeviceContext to deviceInitialization phase with connectionResult and onClose", () => {
    const onContextInitialized = jest.fn();
    const onUserCancel = jest.fn();
    const params = makeParams({
      connectionResult: defaultConnectionResult,
      deviceInitializationInput: defaultDeviceInitializationInput,
      onContextInitialized,
      onUserCancel,
    });
    const state: ExecutorState = {
      type: "initializingDeviceContext",
      connectionResult: defaultConnectionResult,
    };

    const result = deriveHookState(state, params);

    expect(result).toEqual({
      phase: "deviceInitialization",
      connectionResult: defaultConnectionResult,
      deviceInitializationInput: defaultDeviceInitializationInput,
      onContextInitialized,
      onClose: onUserCancel,
    });
  });

  it("maps executingIntent to intentExecution phase with component, jobState and onClose", () => {
    const latestJobState = { step: "running" };
    const intentComponentExtraProps = { foo: "bar" };
    const onUserCancel = jest.fn();
    const params = makeParams({
      latestJobState,
      intentComponent: DummyComponent,
      intentComponentExtraProps,
      onUserCancel,
    });
    const state: ExecutorState = {
      type: "executingIntent",
      connectionResult: defaultConnectionResult,
      extractedContext: defaultExtractedContext,
    };

    const result = deriveHookState(state, params);

    expect(result).toEqual({
      phase: "intentExecution",
      intentComponent: DummyComponent,
      jobState: latestJobState,
      intentComponentExtraProps,
      onClose: onUserCancel,
    });
  });

  it("maps executingIntent with undefined jobState when no emission yet", () => {
    const params = makeParams({ latestJobState: undefined });
    const state: ExecutorState = {
      type: "executingIntent",
      connectionResult: defaultConnectionResult,
      extractedContext: defaultExtractedContext,
    };

    const result = deriveHookState(state, params);

    expect(result).toMatchObject({
      phase: "intentExecution",
      jobState: undefined,
    });
  });

  it("maps executingIntentError to intentError phase with onClose", () => {
    const onRetry = jest.fn();
    const onUserCancel = jest.fn();
    const error = new Error("job failed");
    const params = makeParams({ onRetry, onUserCancel });
    const state: ExecutorState = {
      type: "executingIntentError",
      error,
      connectionResult: defaultConnectionResult,
      extractedContext: defaultExtractedContext,
    };

    const result = deriveHookState(state, params);

    expect(result).toEqual({
      phase: "intentError",
      error,
      device: defaultDevice,
      onRetry,
      onClose: onUserCancel,
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

  it("maps idle to idle phase with null lastIntentSnapshot and onClose when no intent was executed", () => {
    const onUserCancel = jest.fn();
    const params = makeParams({ onUserCancel });
    const state: ExecutorState = { type: "idle" };

    const result = deriveHookState(state, params);

    expect(result).toEqual({
      phase: "idle",
      lastIntentSnapshot: null,
      onClose: onUserCancel,
    });
  });

  it("maps idle to idle phase with lastIntentSnapshot and onClose when provided", () => {
    const onUserCancel = jest.fn();
    const snapshot = {
      intentComponent: DummyComponent,
      jobState: "final-state",
      intentComponentExtraProps: { extra: true },
    };
    const params = makeParams({ lastIntentSnapshot: snapshot, onUserCancel });
    const state: ExecutorState = { type: "idle" };

    const result = deriveHookState(state, params);

    expect(result).toEqual({
      phase: "idle",
      lastIntentSnapshot: snapshot,
      onClose: onUserCancel,
    });
  });

  it("forwards onUserCancel as onClose on every non-invalid phase that exposes onClose", () => {
    const onUserCancel = jest.fn();
    const params = makeParams({ onUserCancel });

    const phases: ExecutorState[] = [
      { type: "connectingDevice" },
      { type: "deviceDisconnected", device: defaultDevice },
      {
        type: "initializingDeviceContext",
        connectionResult: defaultConnectionResult,
      },
      {
        type: "executingIntent",
        connectionResult: defaultConnectionResult,
        extractedContext: defaultExtractedContext,
      },
      {
        type: "executingIntentError",
        error: new Error("e"),
        connectionResult: defaultConnectionResult,
        extractedContext: defaultExtractedContext,
      },
      { type: "idle" },
    ];

    for (const state of phases) {
      const result = deriveHookState(state, params);
      if ("onClose" in result) {
        result.onClose();
      }
    }

    expect(onUserCancel).toHaveBeenCalledTimes(phases.length);
  });
});
