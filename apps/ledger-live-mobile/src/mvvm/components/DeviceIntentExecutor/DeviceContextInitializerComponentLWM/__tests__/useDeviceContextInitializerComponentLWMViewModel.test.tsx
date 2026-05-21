import { Observable, Subject } from "rxjs";
import { act, renderHook } from "@tests/test-renderer";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import { DeviceId } from "@ledgerhq/client-ids/ids";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeviceInfo } from "@ledgerhq/types-live";
import {
  DeviceInteractionRequiredType,
  FinalStateType,
  LoadingStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { ensureAppReadyUseCase } from "@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase";
import type { State } from "~/reducers/types";
import { useDeviceContextInitializerComponentLWMViewModel } from "../useDeviceContextInitializerComponentLWMViewModel";
import type { InitializationInput } from "../../types";

jest.mock("@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase", () => ({
  ensureAppReadyUseCase: jest.fn(),
}));

const mockedEnsureAppReadyUseCase = jest.mocked(ensureAppReadyUseCase);

const connectionResult = {
  dmk: { name: "dmk" },
  sessionId: "session-1",
  compatDeviceId: "device-id",
  compatDeviceModelId: DeviceModelId.nanoX,
  compatDeviceName: "Ledger Nano X",
  compatDeviceWired: false,
} as unknown as DeviceConnectionResult;

const deviceInitializationInput: InitializationInput = {
  appName: "Ethereum",
  dependencies: ["1inch"],
  requireLatestFirmware: false,
  allowPartialDependencies: false,
};

const extractedContext = {
  currentOsVersion: "2.0.0",
  osUpdateAvailable: false,
  currentAppName: "Ethereum",
  currentAppVersion: "1.0.0",
  derivedAddress: "0x123",
};

function setupObservable() {
  const subject = new Subject<EnsureAppReadyState>();
  mockedEnsureAppReadyUseCase.mockReturnValue(subject.asObservable());
  return subject;
}

function withDeprecationDoNotRemind(deprecationDoNotRemind = ["Ethereum"]) {
  return {
    overrideInitialState: (state: State): State => ({
      ...state,
      settings: {
        ...state.settings,
        deprecationDoNotRemind,
      },
    }),
  };
}

function renderViewModel({
  onContextInitialized = jest.fn(),
  deprecationDoNotRemind,
}: {
  onContextInitialized?: jest.Mock;
  deprecationDoNotRemind?: string[];
} = {}) {
  return {
    ...renderHook(
      () =>
        useDeviceContextInitializerComponentLWMViewModel({
          connectionResult,
          deviceInitializationInput,
          onContextInitialized,
        }),
      withDeprecationDoNotRemind(deprecationDoNotRemind),
    ),
    onContextInitialized,
  };
}

describe("useDeviceContextInitializerComponentLWMViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupObservable();
  });

  it("should initialise with loading state and a normalised device", () => {
    const { result } = renderViewModel();

    expect(result.current.state).toEqual({ type: LoadingStateType.Loading });
    expect(result.current.device).toEqual(
      expect.objectContaining({
        id: "device-id",
        modelId: DeviceModelId.nanoX,
        name: "Ledger Nano X",
        wired: false,
      }),
    );
  });

  it("should start ensureAppReadyUseCase with connection, input and dismissed deprecations", () => {
    const deprecationDoNotRemind = ["Ethereum", "Bitcoin"];

    renderViewModel({ deprecationDoNotRemind });

    expect(mockedEnsureAppReadyUseCase).toHaveBeenCalledWith(
      expect.objectContaining({
        dmk: connectionResult.dmk,
        sessionId: connectionResult.sessionId,
        input: deviceInitializationInput,
        deprecationDismissedCurrencyNames: deprecationDoNotRemind,
      }),
    );
  });

  it("should update state when the use case emits a non-final state", () => {
    const subject = setupObservable();
    const { result } = renderViewModel();
    const nextState: EnsureAppReadyState = { type: DeviceInteractionRequiredType.UnlockDevice };

    act(() => {
      subject.next(nextState);
    });

    expect(result.current.state).toEqual(nextState);
  });

  it("should notify context initialization once when the use case succeeds", () => {
    const subject = setupObservable();
    const onContextInitialized = jest.fn();
    const { result } = renderViewModel({ onContextInitialized });
    const successState: EnsureAppReadyState = {
      type: FinalStateType.Success,
      extractedContext,
    };

    act(() => {
      subject.next(successState);
      subject.next(successState);
    });

    expect(result.current.state).toEqual(successState);
    expect(onContextInitialized).toHaveBeenCalledTimes(1);
    expect(onContextInitialized).toHaveBeenCalledWith(extractedContext);
  });

  it("should expose final error state when the observable errors", () => {
    const subject = setupObservable();
    const { result } = renderViewModel();
    const error = new Error("unexpected");

    act(() => {
      subject.error(error);
    });

    expect(result.current.state).toEqual({
      type: FinalStateType.Error,
      error,
    });
  });

  it("should unsubscribe from the use case on cleanup", () => {
    const unsubscribe = jest.fn();
    mockedEnsureAppReadyUseCase.mockReturnValue(
      new Observable<EnsureAppReadyState>(() => unsubscribe),
    );
    const { unmount } = renderViewModel();

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("should dispatch store updates from use case side effects", () => {
    const { store } = renderViewModel();
    const { sideEffects } = mockedEnsureAppReadyUseCase.mock.calls[0][0];
    const deviceId = DeviceId.fromString("010203");
    const deviceInfo = { version: "2.0.0" } as DeviceInfo;

    sideEffects.onDeviceIdObserved(deviceId);
    sideEffects.onLastSeenDeviceInfoObserved({
      modelId: DeviceModelId.nanoX,
      deviceInfo,
      latestFirmware: null,
    });

    const state = store.getState();
    expect(state.identities.deviceIds).toHaveLength(1);
    expect(state.identities.deviceIds[0].equals(deviceId)).toBe(true);
    expect(state.settings.seenDevices).toEqual([
      {
        modelId: DeviceModelId.nanoX,
        deviceInfo,
        apps: [],
      },
    ]);
  });
});
