import { Observable, Subject } from "rxjs";
import { act, renderHook } from "@testing-library/react-native";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import { DeviceId } from "@ledgerhq/client-ids/ids";
import { identitiesSlice } from "@ledgerhq/client-ids/store";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeviceInfo } from "@ledgerhq/types-live";
import {
  DeviceInteractionRequiredType,
  FinalStateType,
  LoadingStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { ensureAppReadyUseCase } from "@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase";
import { setLastSeenDeviceInfo } from "~/actions/settings";
import { useDeviceContextInitializerComponentLWMViewModel } from "../useDeviceContextInitializerComponentLWMViewModel";
import type { InitializationInput } from "../../types";

const mockDispatch = jest.fn();
const mockUseSelector = jest.fn();

jest.mock("~/context/hooks", () => ({
  ...jest.requireActual("~/context/hooks"),
  useDispatch: () => mockDispatch,
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock("@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase", () => ({
  ensureAppReadyUseCase: jest.fn(),
}));

const mockedEnsureAppReadyUseCase = jest.mocked(ensureAppReadyUseCase);

const connectionResult = {
  dmk: { name: "dmk" },
  sessionId: "session-1",
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

function setupUseSelector(deprecationDoNotRemind = ["Ethereum"]) {
  mockUseSelector.mockImplementation(selector =>
    (selector as (state: unknown) => { deprecationDoNotRemind: string[] })({
      settings: { deprecationDoNotRemind },
    }),
  );
}

function setupObservable() {
  const subject = new Subject<EnsureAppReadyState>();
  mockedEnsureAppReadyUseCase.mockReturnValue(subject.asObservable());
  return subject;
}

function renderViewModel(onContextInitialized = jest.fn()) {
  return {
    ...renderHook(() =>
      useDeviceContextInitializerComponentLWMViewModel({
        connectionResult,
        deviceInitializationInput,
        onContextInitialized,
      }),
    ),
    onContextInitialized,
  };
}

describe("useDeviceContextInitializerComponentLWMViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupUseSelector();
    setupObservable();
  });

  it("should initialise with loading state", () => {
    const { result } = renderViewModel();

    expect(result.current).toEqual({ type: LoadingStateType.Loading });
  });

  it("should start ensureAppReadyUseCase with connection, input and dismissed deprecations", () => {
    const deprecationDoNotRemind = ["Ethereum", "Bitcoin"];
    setupUseSelector(deprecationDoNotRemind);

    renderViewModel();

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

    expect(result.current).toEqual(nextState);
  });

  it("should notify context initialization once when the use case succeeds", () => {
    const subject = setupObservable();
    const onContextInitialized = jest.fn();
    const { result } = renderViewModel(onContextInitialized);
    const successState: EnsureAppReadyState = {
      type: FinalStateType.Success,
      extractedContext,
    };

    act(() => {
      subject.next(successState);
      subject.next(successState);
    });

    expect(result.current).toEqual(successState);
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

    expect(result.current).toEqual({
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
    renderViewModel();
    const { sideEffects } = mockedEnsureAppReadyUseCase.mock.calls[0][0];
    const deviceId = DeviceId.fromString("010203");
    const deviceInfo = { version: "2.0.0" } as DeviceInfo;

    sideEffects.onDeviceIdObserved(deviceId);
    sideEffects.onLastSeenDeviceInfoObserved({
      modelId: DeviceModelId.nanoX,
      deviceInfo,
      latestFirmware: null,
    });

    expect(mockDispatch).toHaveBeenCalledWith(identitiesSlice.actions.addDeviceId(deviceId));
    expect(mockDispatch).toHaveBeenCalledWith(
      setLastSeenDeviceInfo({
        modelId: DeviceModelId.nanoX,
        deviceInfo,
        apps: [],
      }),
    );
  });
});
