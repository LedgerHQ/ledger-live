import type {
  DeviceSessionState,
  GetAppAndVersionResponse,
  GetDeviceMetadataDAOutput,
  InternalApi,
} from "@ledgerhq/device-management-kit";
import {
  DeviceActionStatus,
  DeviceModelId as DmkDeviceModelId,
  DeviceSessionStateType,
  UnknownDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import type {
  ConnectAppDAError,
  ConnectAppDARequiredInteraction,
  ConnectAppDAState,
} from "../ConnectApp/types";
import { Subject } from "rxjs";
import {
  AppInteractionRequiredStateType,
  FinalStateType,
  LoadingStateType,
  type EnsureAppReadyState,
} from "./state";
import type { ConnectAppDASnapshotHandler, DeprecationPresentationInput } from "./types";
import {
  EnsureAppReadyDeviceAction,
  type EnsureAppReadyDAInput,
  type EnsureAppReadyDeviceActionConstructorArgs,
  type EnsureAppReadyDeviceActionDependencies,
  type EnsureAppReadyMachineDependencies,
} from "./EnsureAppReadyDeviceAction";

class TestEnsureAppReadyDeviceAction extends EnsureAppReadyDeviceAction {
  constructor(
    args: EnsureAppReadyDeviceActionConstructorArgs,
    private readonly machineDependencies: EnsureAppReadyMachineDependencies,
  ) {
    super(args);
  }

  override extractDependencies(): EnsureAppReadyMachineDependencies {
    return this.machineDependencies;
  }
}

const firmwareMetadata = {
  isBootloader: false,
  seVersion: "2.1.0",
  targetId: 1,
  seTargetId: 1,
  mcuSephVersion: "1.0.0",
  mcuTargetId: 1,
  seFlags: Uint8Array.from([1, 2, 3]),
  mcuBootloaderVersion: "1.0.0",
  hwVersion: "01",
  langId: 1,
};

const deviceMetadata = {
  firmwareVersion: {
    os: "2.1.0",
    metadata: firmwareMetadata,
  },
  firmwareUpdateContext: undefined,
} as unknown as GetDeviceMetadataDAOutput;

const currentApp: GetAppAndVersionResponse = {
  name: "Ethereum",
  version: "2.0.0",
};

const loadingState: EnsureAppReadyState = {
  type: LoadingStateType.Loading,
};

const successState: EnsureAppReadyState = {
  type: FinalStateType.Success,
  extractedContext: {
    currentOsVersion: "2.1.0",
    osUpdateAvailable: false,
    currentAppName: "Ethereum",
    currentAppVersion: "2.0.0",
    derivedAddress: "0xderived",
  },
};

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

async function waitForCondition(predicate: () => boolean) {
  for (let index = 0; index < 10; index++) {
    await flushPromises();
    if (predicate()) return;
  }
  throw new Error("Condition was not met");
}

function makeInternalApiMock(): jest.Mocked<InternalApi> {
  return {
    sendApdu: jest.fn(),
    sendCommand: jest.fn(),
    getDeviceModel: jest.fn(),
    getDeviceSessionState: jest.fn(),
    getDeviceSessionStateObservable: jest.fn(),
    setDeviceSessionState: jest.fn(),
    getManagerApiService: jest.fn(),
    getSecureChannelService: jest.fn(),
  };
}

function makeSessionState(): DeviceSessionState {
  return {
    sessionStateType: DeviceSessionStateType.ReadyWithoutSecureChannel,
    deviceModelId: DmkDeviceModelId.NANO_X,
    firmwareVersion: {
      os: "2.1.0",
      metadata: firmwareMetadata,
    },
    firmwareUpdateContext: undefined,
  } as unknown as DeviceSessionState;
}

function makeDeviceInitializationInput(
  overrides: { appName?: string; deprecation?: DeprecationPresentationInput } = {},
): { appName: string; deprecation?: DeprecationPresentationInput } {
  return {
    appName: "Ethereum",
    ...overrides,
  };
}

function makePending(
  requiredUserInteraction: ConnectAppDARequiredInteraction,
  overrides: Partial<
    Extract<ConnectAppDAState, { status: DeviceActionStatus.Pending }>["intermediateValue"]
  > = {},
): ConnectAppDAState {
  return {
    status: DeviceActionStatus.Pending,
    intermediateValue: {
      requiredUserInteraction,
      installPlan: null,
      deviceDeprecation: undefined,
      deviceMetadata: undefined,
      ...overrides,
    },
  } as unknown as ConnectAppDAState;
}

function makeCompleted(
  overrides: Partial<
    Extract<ConnectAppDAState, { status: DeviceActionStatus.Completed }>["output"]
  > = {},
): ConnectAppDAState {
  return {
    status: DeviceActionStatus.Completed,
    output: {
      derivation: "0xderived",
      deviceMetadata,
      currentApp,
      ...overrides,
    },
  };
}

function makeErrored(error: ConnectAppDAError): ConnectAppDAState {
  return {
    status: DeviceActionStatus.Error,
    error,
  };
}

function makeConnectAppDeviceActionMock(params: {
  failure?: unknown;
  states: ConnectAppDAState[];
}) {
  const subject = new Subject<ConnectAppDAState>();
  const cancel = jest.fn();
  const deviceAction = {
    _execute: jest.fn(() => {
      setTimeout(() => {
        if (params.failure) {
          subject.error(params.failure);
          return;
        }

        params.states.forEach(state => subject.next(state));
        subject.complete();
      }, 0);

      return {
        observable: subject.asObservable(),
        cancel,
      };
    }),
  };

  return { cancel, deviceAction };
}

function createHarness(params: {
  connectAppFailure?: unknown;
  connectAppStates?: ConnectAppDAState[];
  appName?: string;
  deprecation?: DeprecationPresentationInput;
  dependencies?: Partial<EnsureAppReadyDeviceActionDependencies>;
}) {
  const internalApi = makeInternalApiMock();
  const sessionState = makeSessionState();
  const emittedStates: EnsureAppReadyState[] = [];
  const actionStates: unknown[] = [];
  let completed = false;

  const observer = {
    next: jest.fn((state: EnsureAppReadyState) => emittedStates.push(state)),
  };
  const snapshotHandler: jest.Mocked<ConnectAppDASnapshotHandler> = {
    handleSnapshot: jest.fn(),
  };
  const buildFinalState = jest.fn(() => successState);
  const shouldUpgrade = jest.fn(() => false);
  const getCurrentDeviceState = jest.fn(() => sessionState);
  const retry = jest.fn();
  const connectAppDeviceAction = makeConnectAppDeviceActionMock({
    failure: params.connectAppFailure,
    states: params.connectAppStates ?? [makePending(UserInteractionRequired.None), makeCompleted()],
  });

  const input: EnsureAppReadyDAInput = {
    appName: params.appName ?? makeDeviceInitializationInput().appName,
    deprecation: params.deprecation ?? makeDeviceInitializationInput().deprecation,
    deprecationDismissedCurrencyNames: [],
    connectAppDeviceAction: connectAppDeviceAction.deviceAction,
    observer,
    retry,
    additionalSnapshotHandlers: [snapshotHandler],
  };

  const action = new TestEnsureAppReadyDeviceAction(
    {
      input,
      dependencies: {
        buildFinalState,
        shouldUpgrade,
        ...params.dependencies,
      },
    },
    {
      getCurrentDeviceState,
    },
  );

  const execution = action._execute(internalApi);
  const completion = new Promise<void>((resolve, reject) => {
    execution.observable.subscribe({
      next: state => actionStates.push(state),
      error: reject,
      complete: () => {
        completed = true;
        resolve();
      },
    });
  });

  return {
    buildFinalState,
    completed: () => completed,
    completion,
    execution,
    getCurrentDeviceState,
    internalApi,
    actionStates,
    emittedStates,
    observer,
    retry,
    shouldUpgrade,
    snapshotHandler,
  };
}

function makeActionInput(overrides: Partial<EnsureAppReadyDAInput> = {}): EnsureAppReadyDAInput {
  const connectAppDeviceAction = makeConnectAppDeviceActionMock({
    states: [makeCompleted()],
  });

  return {
    appName: makeDeviceInitializationInput().appName,
    deprecation: makeDeviceInitializationInput().deprecation,
    deprecationDismissedCurrencyNames: [],
    connectAppDeviceAction: connectAppDeviceAction.deviceAction,
    observer: {
      next: jest.fn(),
    },
    retry: jest.fn(),
    additionalSnapshotHandlers: [],
    ...overrides,
  };
}

function makeActionDependencies(
  overrides: Partial<EnsureAppReadyDeviceActionDependencies> = {},
): EnsureAppReadyDeviceActionDependencies {
  return {
    buildFinalState: jest.fn(() => successState),
    shouldUpgrade: jest.fn(() => false),
    ...overrides,
  };
}

describe("EnsureAppReadyDeviceAction", () => {
  describe("GIVEN production dependencies are extracted", () => {
    it("WHEN dependencies are extracted THEN it exposes the current device state getter", () => {
      // GIVEN
      const internalApi = makeInternalApiMock();
      const sessionState = makeSessionState();
      internalApi.getDeviceSessionState.mockReturnValue(sessionState);
      const action = new EnsureAppReadyDeviceAction({
        input: makeActionInput(),
        dependencies: makeActionDependencies(),
      });

      // WHEN
      const dependencies = action.extractDependencies(internalApi);

      // THEN
      expect(dependencies.getCurrentDeviceState()).toBe(sessionState);
      expect(internalApi.sendCommand).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN connect app completes successfully", () => {
    it("WHEN the wrapper finalizes THEN it fetches the current app and emits the built final state", async () => {
      // GIVEN
      const { appName, deprecation } = makeDeviceInitializationInput();
      const harness = createHarness({ appName, deprecation });

      // WHEN
      await harness.completion;

      // THEN
      expect(harness.buildFinalState).toHaveBeenCalledWith({
        deviceMetadata,
        currentApp,
        derivation: "0xderived",
      });
      expect(harness.snapshotHandler.handleSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({ status: DeviceActionStatus.Pending }),
      );
      expect(harness.snapshotHandler.handleSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({ status: DeviceActionStatus.Completed }),
      );
      expect(harness.emittedStates).toEqual([loadingState, successState]);
      expect(harness.actionStates[harness.actionStates.length - 1]).toEqual({
        status: DeviceActionStatus.Completed,
        output: undefined,
      });
    });
  });

  describe("GIVEN the current app is outdated", () => {
    it("WHEN the warning is continued THEN it finalizes the initialization", async () => {
      // GIVEN
      const shouldUpgrade = jest.fn(() => true);
      const harness = createHarness({
        dependencies: {
          shouldUpgrade,
        },
      });

      // WHEN
      await waitForCondition(() =>
        harness.emittedStates.some(
          state => state.type === AppInteractionRequiredStateType.OutdatedAppWarning,
        ),
      );

      // THEN
      expect(harness.completed()).toBe(false);
      const warningState = harness.emittedStates.find(
        state => state.type === AppInteractionRequiredStateType.OutdatedAppWarning,
      );
      expect(warningState).toMatchObject({
        type: AppInteractionRequiredStateType.OutdatedAppWarning,
        appName: "Ethereum",
      });

      if (
        !warningState ||
        warningState.type !== AppInteractionRequiredStateType.OutdatedAppWarning
      ) {
        throw new Error("Expected an outdated-app warning state");
      }

      warningState.onContinue();
      await harness.completion;

      expect(shouldUpgrade).toHaveBeenCalledWith("Ethereum", "2.0.0");
      expect(harness.emittedStates[harness.emittedStates.length - 1]).toBe(successState);
    });

    it("WHEN the current app name is missing THEN the warning falls back to the requested app name", async () => {
      // GIVEN
      const shouldUpgrade = jest.fn(() => true);
      const harness = createHarness({
        connectAppStates: [
          makePending(UserInteractionRequired.None),
          makeCompleted({
            currentApp: {
              ...currentApp,
              name: undefined,
            } as unknown as GetAppAndVersionResponse,
          }),
        ],
        dependencies: {
          shouldUpgrade,
        },
      });

      // WHEN
      await waitForCondition(() =>
        harness.emittedStates.some(
          state => state.type === AppInteractionRequiredStateType.OutdatedAppWarning,
        ),
      );

      // THEN
      const warningState = harness.emittedStates.find(
        state => state.type === AppInteractionRequiredStateType.OutdatedAppWarning,
      );
      expect(warningState).toMatchObject({
        type: AppInteractionRequiredStateType.OutdatedAppWarning,
        appName: "Ethereum",
      });

      if (
        !warningState ||
        warningState.type !== AppInteractionRequiredStateType.OutdatedAppWarning
      ) {
        throw new Error("Expected an outdated-app warning state");
      }

      warningState.onContinue();
      await harness.completion;
    });
  });

  describe("GIVEN connect app terminates with an error", () => {
    it("WHEN the child terminal state is an error THEN it terminates without fetching the current app", async () => {
      // GIVEN
      const harness = createHarness({
        connectAppStates: [
          makeErrored(new UnknownDAError("connect-app-error") as unknown as ConnectAppDAError),
        ],
      });

      // WHEN
      await harness.completion;

      // THEN
      expect(harness.actionStates[harness.actionStates.length - 1]).toEqual({
        status: DeviceActionStatus.Completed,
        output: undefined,
      });
    });

    it("WHEN the child actor fails THEN it returns an unexpected wrapper error", async () => {
      // GIVEN
      const error = new Error("child-actor-failure");
      const harness = createHarness({
        connectAppFailure: error,
      });

      // WHEN
      await harness.completion;

      // THEN
      expect(harness.actionStates[harness.actionStates.length - 1]).toMatchObject({
        status: DeviceActionStatus.Error,
        error: expect.objectContaining({
          _tag: "UnknownDAError",
          originalError: expect.objectContaining({
            message: "Unexpected app initialization device action failure: child-actor-failure",
          }),
        }),
      });
    });

    it("WHEN the child actor fails without an error message THEN it returns an unknown wrapper error", async () => {
      // GIVEN
      const harness = createHarness({
        connectAppFailure: {},
      });

      // WHEN
      await harness.completion;

      // THEN
      expect(harness.actionStates[harness.actionStates.length - 1]).toMatchObject({
        status: DeviceActionStatus.Error,
        error: expect.objectContaining({
          _tag: "UnknownDAError",
          originalError: expect.objectContaining({
            message: "Unexpected app initialization device action failure: Unknown error",
          }),
        }),
      });
    });
  });

  describe("GIVEN connect app returns no current app", () => {
    it("WHEN finalization runs THEN it terminates with the missing-current-app invariant error", async () => {
      // GIVEN
      const harness = createHarness({
        connectAppStates: [
          makePending(UserInteractionRequired.None),
          makeCompleted({ currentApp: undefined }),
        ],
      });

      // WHEN
      await harness.completion;

      // THEN
      expect(harness.actionStates[harness.actionStates.length - 1]).toMatchObject({
        status: DeviceActionStatus.Error,
        error: expect.objectContaining({
          _tag: "UnknownDAError",
          originalError: expect.objectContaining({
            message: "Missing current app before finalizing initialization",
          }),
        }),
      });
    });
  });

  describe("GIVEN connect app completes without a terminal state", () => {
    it("WHEN the child reaches done THEN it returns a missing-terminal-state wrapper error", async () => {
      // GIVEN
      const harness = createHarness({
        connectAppStates: [],
      });

      // WHEN
      await harness.completion;

      // THEN
      expect(harness.actionStates[harness.actionStates.length - 1]).toMatchObject({
        status: DeviceActionStatus.Error,
        error: expect.objectContaining({
          _tag: "UnknownDAError",
          originalError: expect.objectContaining({
            message: "Missing connect-app terminal state in initialization wrapper",
          }),
        }),
      });
    });
  });
});
