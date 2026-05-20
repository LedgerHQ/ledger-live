import type { DeviceSessionState, InstallPlan } from "@ledgerhq/device-management-kit";
import { DeviceActionStatus, UserInteractionRequired } from "@ledgerhq/device-management-kit";
import type { ConnectAppDAError, ConnectAppDAState } from "../ConnectApp/types";
import { DeviceInteractionRequiredType, FinalStateType, type EnsureAppReadyState } from "./state";
import { EnsureAppReadyStateEmitter } from "./EnsureAppReadyStateEmitter";
import { mapConnectAppDAErrorStatus, mapConnectAppDAPendingStatus } from "./stateMapping";

jest.mock("./stateMapping", () => ({
  mapConnectAppDAErrorStatus: jest.fn(),
  mapConnectAppDAPendingStatus: jest.fn(),
}));

const mapConnectAppDAErrorStatusMock = jest.mocked(mapConnectAppDAErrorStatus);
const mapConnectAppDAPendingStatusMock = jest.mocked(mapConnectAppDAPendingStatus);

const appName = "Ethereum";

const deprecationDismissedCurrencyNames = ["Bitcoin"];

function makeSessionState(): DeviceSessionState {
  return {
    deviceModelId: "nanoX",
  } as unknown as DeviceSessionState;
}

function makeInstallPlan(): InstallPlan {
  return {
    currentIndex: 0,
    currentProgress: 0.5,
    installPlan: [{ versionName: "Ethereum" }],
  } as unknown as InstallPlan;
}

function makePending(
  overrides: Partial<
    Extract<ConnectAppDAState, { status: DeviceActionStatus.Pending }>["intermediateValue"]
  > = {},
): ConnectAppDAState {
  return {
    status: DeviceActionStatus.Pending,
    intermediateValue: {
      requiredUserInteraction: UserInteractionRequired.None,
      installPlan: null,
      deviceDeprecation: undefined,
      deviceMetadata: undefined,
      ...overrides,
    },
  } as unknown as ConnectAppDAState;
}

function makeErrored(error: ConnectAppDAError): ConnectAppDAState {
  return {
    status: DeviceActionStatus.Error,
    error,
  };
}

function createHarness() {
  const emittedStates: EnsureAppReadyState[] = [];
  const observer = {
    next: jest.fn((state: EnsureAppReadyState) => emittedStates.push(state)),
  };
  const getCurrentDeviceState = jest.fn(() => makeSessionState());
  const retry = jest.fn();
  const emitter = new EnsureAppReadyStateEmitter({
    observer,
    appName,
    deprecationDismissedCurrencyNames,
    getCurrentDeviceState,
    retry,
  });

  return {
    emittedStates,
    emitter,
    getCurrentDeviceState,
    observer,
    retry,
  };
}

describe("EnsureAppReadyStateEmitter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GIVEN a pending connect-app snapshot", () => {
    it("WHEN the pending state maps to a job state THEN it emits the mapped state", () => {
      // GIVEN
      const harness = createHarness();
      const state = makePending({
        requiredUserInteraction: UserInteractionRequired.UnlockDevice,
      });
      const mappedState: EnsureAppReadyState = {
        type: DeviceInteractionRequiredType.UnlockDevice,
      };
      mapConnectAppDAPendingStatusMock.mockReturnValue(mappedState);

      // WHEN
      harness.emitter.handleSnapshot(state);

      // THEN
      expect(mapConnectAppDAPendingStatusMock).toHaveBeenCalledWith({
        state,
        deprecationDismissedCurrencyNames,
      });
      expect(harness.emittedStates).toEqual([mappedState]);
    });

    it("WHEN the pending state does not map to a job state THEN it does not emit", () => {
      // GIVEN
      const harness = createHarness();
      const state = makePending();
      mapConnectAppDAPendingStatusMock.mockReturnValue(null);

      // WHEN
      harness.emitter.handleSnapshot(state);

      // THEN
      expect(mapConnectAppDAPendingStatusMock).toHaveBeenCalledWith({
        state,
        deprecationDismissedCurrencyNames,
      });
      expect(harness.observer.next).not.toHaveBeenCalled();
    });

    it("WHEN an install plan is present THEN it stores it for future error mapping", () => {
      // GIVEN
      const harness = createHarness();
      const installPlan = makeInstallPlan();
      const pendingState = makePending({ installPlan });
      const error = new Error("out-of-memory") as ConnectAppDAError;
      const errorState = makeErrored(error);
      mapConnectAppDAPendingStatusMock.mockReturnValue(null);
      mapConnectAppDAErrorStatusMock.mockReturnValue(null);

      // WHEN
      harness.emitter.handleSnapshot(pendingState);
      harness.emitter.handleSnapshot(errorState);

      // THEN
      expect(mapConnectAppDAErrorStatusMock).toHaveBeenCalledWith({
        state: errorState,
        appName,
        getCurrentDeviceState: harness.getCurrentDeviceState,
        latestInstallPlan: installPlan,
        retry: harness.retry,
      });
    });
  });

  describe("GIVEN an error connect-app snapshot", () => {
    it("WHEN the error state maps to a job state THEN it emits the mapped state", () => {
      // GIVEN
      const harness = createHarness();
      const error = new Error("connect-app-error") as ConnectAppDAError;
      const state = makeErrored(error);
      const mappedState: EnsureAppReadyState = {
        type: FinalStateType.Error,
        error,
      };
      mapConnectAppDAErrorStatusMock.mockReturnValue(mappedState);

      // WHEN
      harness.emitter.handleSnapshot(state);

      // THEN
      expect(mapConnectAppDAErrorStatusMock).toHaveBeenCalledWith({
        state,
        appName,
        getCurrentDeviceState: harness.getCurrentDeviceState,
        latestInstallPlan: null,
        retry: harness.retry,
      });
      expect(harness.emittedStates).toEqual([mappedState]);
    });

    it("WHEN the error state does not map to a job state THEN it does not emit", () => {
      // GIVEN
      const harness = createHarness();
      const state = makeErrored(new Error("ignored") as ConnectAppDAError);
      mapConnectAppDAErrorStatusMock.mockReturnValue(null);

      // WHEN
      harness.emitter.handleSnapshot(state);

      // THEN
      expect(mapConnectAppDAErrorStatusMock).toHaveBeenCalledWith({
        state,
        appName,
        getCurrentDeviceState: harness.getCurrentDeviceState,
        latestInstallPlan: null,
        retry: harness.retry,
      });
      expect(harness.observer.next).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN completed, not-started, or stopped connect-app snapshots", () => {
    it("WHEN they are handled THEN it ignores them", () => {
      // GIVEN
      const harness = createHarness();

      // WHEN
      harness.emitter.handleSnapshot({
        status: DeviceActionStatus.Completed,
        output: {},
      });
      harness.emitter.handleSnapshot({
        status: DeviceActionStatus.NotStarted,
      } as unknown as ConnectAppDAState);
      harness.emitter.handleSnapshot({
        status: DeviceActionStatus.Stopped,
      } as unknown as ConnectAppDAState);

      // THEN
      expect(mapConnectAppDAPendingStatusMock).not.toHaveBeenCalled();
      expect(mapConnectAppDAErrorStatusMock).not.toHaveBeenCalled();
      expect(harness.observer.next).not.toHaveBeenCalled();
    });
  });
});
