/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any */

import { DeviceActionStatus, DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  ConnectAppDeviceAction,
  DeviceInteractionRequiredType,
  DmkCompatTransport,
  EnsureAppReadyDeviceAction,
  LoadingStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { Subject } from "rxjs";
import { getCryptoCurrencyById } from "../../../../currencies";
import getAddress from "../../../../hw/getAddress";
import { runEnsureAppReadyAttempt } from "./runEnsureAppReadyAttempt";

jest.mock("@ledgerhq/live-dmk-shared", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-shared");

  return {
    ...actual,
    EnsureAppReadyDeviceAction: jest.fn().mockImplementation(({ input, dependencies }) => ({
      dependencies,
      input,
    })),
    ConnectAppDeviceAction: jest.fn().mockImplementation(function (this: any, { input }) {
      this.input = input;
      this._execute = jest.fn();
    }),
    buildExtractedContext: jest.fn(({ deviceMetadata, currentApp, derivation }) => ({
      currentOsVersion: deviceMetadata?.firmwareVersion.os ?? "unknown",
      osUpdateAvailable: Boolean(deviceMetadata?.firmwareUpdateContext?.availableUpdate),
      currentAppName: currentApp.name,
      currentAppVersion: currentApp.version,
      derivedAddress: derivation,
    })),
    DmkCompatTransport: jest.fn().mockImplementation(function (this: any, dmk, sessionId) {
      this.dmk = dmk;
      this.sessionId = sessionId;
    }),
  };
});

jest.mock("../../../../currencies", () => ({
  getCryptoCurrencyById: jest.fn((id: string) => ({ id })),
}));

jest.mock("../../../../hw/getAddress", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    address: "0xderived",
  }),
}));

const mockEnsureAppReadyDeviceAction = jest.mocked(EnsureAppReadyDeviceAction);
const mockConnectAppDeviceAction = jest.mocked(ConnectAppDeviceAction);
const mockDmkCompatTransport = jest.mocked(DmkCompatTransport);
const mockGetDeprecationConfig = jest.fn();
const mockGetMinVersion = jest.fn();
const mockShouldUpgrade = jest.fn();
const mockGetCryptoCurrencyById = jest.mocked(getCryptoCurrencyById);
const mockGetAddress = jest.mocked(getAddress);

function makeWrapperError(error: unknown) {
  return {
    status: DeviceActionStatus.Error,
    error,
  } as any;
}

function makeDependencies() {
  return {
    getDeprecationConfig: mockGetDeprecationConfig,
    getMinVersion: mockGetMinVersion,
    shouldUpgrade: mockShouldUpgrade,
  };
}

function createHarness(initOverrides: Record<string, unknown> = {}) {
  const actionSubject = new Subject<any>();
  const cancel = jest.fn();
  const dmk = {
    executeDeviceAction: jest.fn(() => ({
      observable: actionSubject.asObservable(),
      cancel,
    })),
    getConnectedDevice: jest.fn(() => ({
      modelId: DeviceModelId.NANO_X,
    })),
    _unsafeBypassIntentQueue: jest.fn(),
  } as any;
  const retry = jest.fn();
  const sideEffects = {
    onDeviceIdObserved: jest.fn(),
    onLastSeenDeviceInfoObserved: jest.fn(),
  };
  const states: EnsureAppReadyState[] = [];
  let completed = false;

  const subscription = runEnsureAppReadyAttempt({
    dmk,
    sessionId: "session-1",
    input: {
      appName: "Ethereum",
      dependencies: ["1inch"],
      requireLatestFirmware: false,
      allowPartialDependencies: false,
      ...initOverrides,
    } as any,
    deprecationDismissedCurrencyNames: [],
    retry,
    sideEffects,
    dependencies: makeDependencies(),
  }).subscribe({
    next: state => states.push(state),
    complete: () => {
      completed = true;
    },
  });

  const getDeviceActionInput = () =>
    mockEnsureAppReadyDeviceAction.mock.calls[
      mockEnsureAppReadyDeviceAction.mock.calls.length - 1
    ]?.[0]?.input;
  const getDeviceActionDependencies = () =>
    mockEnsureAppReadyDeviceAction.mock.calls[
      mockEnsureAppReadyDeviceAction.mock.calls.length - 1
    ]?.[0]?.dependencies;

  return {
    actionSubject,
    cancel,
    completed: () => completed,
    dmk,
    getDeviceActionDependencies,
    getDeviceActionInput,
    retry,
    sideEffects,
    states,
    subscription,
  };
}

describe("runEnsureAppReadyAttempt", () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockGetMinVersion.mockReturnValue(undefined);
    mockGetDeprecationConfig.mockReturnValue(undefined);
    mockGetAddress.mockResolvedValue({ address: "0xderived" } as any);
    mockGetCryptoCurrencyById.mockImplementation((id: string) => ({ id }) as any);
  });

  it("builds the wrapper device action input and derivation callback", async () => {
    mockGetMinVersion.mockImplementation((_appName, model) =>
      model === DeviceModelId.NANO_X ? "1.2.3" : undefined,
    );

    const harness = createHarness({
      requiresDerivation: {
        currencyId: "ethereum",
        derivationMode: "ethM",
        path: "44'/60'/0'/0/0",
      },
      deprecation: {
        flow: "send",
        currencyName: "Ethereum",
      },
    });

    const input = harness.getDeviceActionInput();

    expect(input.appName).toBe("Ethereum");
    expect(input.deprecation).toEqual({
      flow: "send",
      currencyName: "Ethereum",
    });
    expect(input).not.toHaveProperty("dependencies");
    expect(input).not.toHaveProperty("requiresDerivation");
    expect(input).not.toHaveProperty("expectedAccount");
    expect(typeof input.observer.next).toBe("function");
    expect(input.retry).toBe(harness.retry);
    expect(input.additionalSnapshotHandlers).toHaveLength(1);
    expect(harness.dmk.getConnectedDevice).toHaveBeenCalledWith({ sessionId: "session-1" });

    expect(input.connectAppDeviceAction).toBeInstanceOf(ConnectAppDeviceAction);
    expect(mockConnectAppDeviceAction).toHaveBeenCalledTimes(1);
    const connectAppInput = mockConnectAppDeviceAction.mock.calls[0]?.[0]?.input;

    expect(connectAppInput.application).toMatchObject({
      name: "Ethereum",
      constraints: [
        {
          minVersion: "1.2.3",
          applicableModels: [DeviceModelId.NANO_X],
        },
      ],
    });
    expect(connectAppInput.dependencies).toEqual([
      {
        name: "1inch",
        constraints: [
          {
            minVersion: "1.2.3",
            applicableModels: [DeviceModelId.NANO_X],
          },
        ],
      },
    ]);
    expect(connectAppInput.allowMissingApplication).toBe(false);
    expect(connectAppInput.deprecationConfig).toBeUndefined();
    expect(connectAppInput.requiredDerivation).toBeDefined();
    expect(harness.getDeviceActionDependencies().shouldUpgrade).toBe(mockShouldUpgrade);

    const { requiredDerivation } = connectAppInput;

    if (!requiredDerivation) {
      throw new Error("requiredDerivation should be defined");
    }

    await expect(requiredDerivation()).resolves.toBe("0xderived");

    expect(mockDmkCompatTransport).toHaveBeenCalledWith(harness.dmk, "session-1");
    expect(harness.dmk._unsafeBypassIntentQueue).toHaveBeenNthCalledWith(1, {
      bypass: true,
      sessionId: "session-1",
    });
    expect(harness.dmk._unsafeBypassIntentQueue).toHaveBeenNthCalledWith(2, {
      bypass: false,
      sessionId: "session-1",
    });
    expect(mockGetCryptoCurrencyById).toHaveBeenCalledWith("ethereum");
    expect(mockGetAddress).toHaveBeenCalledWith(expect.anything(), {
      currency: { id: "ethereum" },
      derivationMode: "ethM",
      path: "44'/60'/0'/0/0",
    });

    harness.subscription.unsubscribe();
  });

  it("forwards states emitted directly by the device action observer", () => {
    const harness = createHarness();
    const input = harness.getDeviceActionInput();

    harness.actionSubject.next({
      status: DeviceActionStatus.Pending,
      intermediateValue: {
        requiredUserInteraction: "ignored",
      },
    });
    input.observer.next({ type: LoadingStateType.Loading });
    input.observer.next({ type: DeviceInteractionRequiredType.ConfirmOpenApp });
    harness.actionSubject.complete();

    expect(harness.states).toEqual([
      { type: LoadingStateType.Loading },
      { type: DeviceInteractionRequiredType.ConfirmOpenApp },
    ]);
    expect(harness.completed()).toBe(true);

    harness.subscription.unsubscribe();
  });

  it("does not remap device action lifecycle payloads into job states", () => {
    const harness = createHarness();
    const input = harness.getDeviceActionInput();

    harness.actionSubject.next({
      status: DeviceActionStatus.Pending,
      intermediateValue: {
        requiredUserInteraction: "ignored",
      },
    });
    harness.actionSubject.next({
      status: DeviceActionStatus.Completed,
      output: undefined,
    });

    expect(harness.states).toEqual([{ type: LoadingStateType.Loading }]);

    input.observer.next({ type: LoadingStateType.Loading });
    expect(harness.states).toEqual([{ type: LoadingStateType.Loading }]);

    harness.subscription.unsubscribe();
  });

  it("builds final states through the injected dependency", () => {
    const harness = createHarness();
    const dependencies = harness.getDeviceActionDependencies();

    const result = dependencies.buildFinalState({
      deviceMetadata: undefined,
      currentApp: {
        name: "Ethereum",
        version: "2.0.0",
      },
      derivation: undefined,
    });

    expect(result).toMatchObject({
      type: "success",
      extractedContext: {
        currentAppName: "Ethereum",
        currentAppVersion: "2.0.0",
      },
    });

    harness.subscription.unsubscribe();
  });

  it("forwards wrapper observable errors to the job observer", () => {
    const error = new Error("wrapper-observable-error");
    const observedErrors: unknown[] = [];
    const actionSubject = new Subject<any>();
    const dmk = {
      executeDeviceAction: jest.fn(() => ({
        observable: actionSubject.asObservable(),
        cancel: jest.fn(),
      })),
      getConnectedDevice: jest.fn(() => ({
        modelId: DeviceModelId.NANO_X,
      })),
      _unsafeBypassIntentQueue: jest.fn(),
    } as any;

    const subscription = runEnsureAppReadyAttempt({
      dmk,
      sessionId: "session-1",
      input: {
        appName: "Ethereum",
        dependencies: [],
        requireLatestFirmware: false,
        allowPartialDependencies: false,
      } as any,
      deprecationDismissedCurrencyNames: [],
      retry: jest.fn(),
      sideEffects: {
        onDeviceIdObserved: jest.fn(),
        onLastSeenDeviceInfoObserved: jest.fn(),
      },
      dependencies: makeDependencies(),
    }).subscribe({
      error: observedError => observedErrors.push(observedError),
    });

    actionSubject.error(error);

    expect(observedErrors).toEqual([error]);
    subscription.unsubscribe();
  });

  it("converts unexpected wrapper errors to error states", () => {
    const harness = createHarness();
    const error = new Error("unexpected-wrapper-error");

    harness.actionSubject.next(makeWrapperError(error));

    expect(harness.states).toEqual([
      {
        type: LoadingStateType.Loading,
      },
      {
        type: "error",
        error,
      },
    ]);

    harness.subscription.unsubscribe();
  });
});
