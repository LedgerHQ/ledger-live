import React from "react";
import { Observable, Subject } from "rxjs";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { act, renderHook } from "@testing-library/react";
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
import type { State } from "~/renderer/reducers";
import { INITIAL_STATE as INITIAL_SETTINGS_STATE } from "~/renderer/reducers/settings";
import createStore, { type ReduxStore } from "~/state-manager/configureStore";
import { useDeviceContextInitializerComponentLWDViewModel } from "../useDeviceContextInitializerComponentLWDViewModel";
import { connectionResult, deviceInitializationInput } from "../testUtils";

jest.mock("@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase", () => ({
  ensureAppReadyUseCase: jest.fn(),
}));

const mockedEnsureAppReadyUseCase = jest.mocked(ensureAppReadyUseCase);

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

function renderViewModel({
  onContextInitialized = jest.fn(),
  deprecationDoNotRemind = ["Ethereum"],
}: {
  onContextInitialized?: jest.Mock;
  deprecationDoNotRemind?: string[];
} = {}) {
  const store = createStore({
    state: {
      settings: {
        ...INITIAL_SETTINGS_STATE,
        deprecationDoNotRemind,
      },
    } as State,
    fetchRemoteFlags: null,
  });

  const rendered = renderHook(
    () =>
      useDeviceContextInitializerComponentLWDViewModel({
        connectionResult,
        deviceInitializationInput,
        onContextInitialized,
      }),
    {
      wrapper: ({ children }) => <TestWrapper store={store}>{children}</TestWrapper>,
    },
  );

  return { ...rendered, store, onContextInitialized };
}

function TestWrapper({ children, store }: { children: React.ReactNode; store: ReduxStore }) {
  return (
    <Provider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );
}

describe("useDeviceContextInitializerComponentLWDViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupObservable();
  });

  it("GIVEN the initializer starts WHEN rendering the view model THEN it exposes loading state and a normalized device", () => {
    // WHEN
    const { result } = renderViewModel();

    // THEN
    expect(result.current.state).toEqual({ type: LoadingStateType.Loading });
    expect(result.current.device).toEqual(
      expect.objectContaining({
        id: "device-id",
        modelId: DeviceModelId.nanoX,
        name: "Ledger Nano X",
        wired: true,
      }),
    );
  });

  it("GIVEN dismissed deprecations WHEN rendering the view model THEN it starts ensure app ready with them", () => {
    // GIVEN
    const deprecationDoNotRemind = ["Ethereum", "Bitcoin"];

    // WHEN
    renderViewModel({ deprecationDoNotRemind });

    // THEN
    expect(mockedEnsureAppReadyUseCase).toHaveBeenCalledWith(
      expect.objectContaining({
        dmk: connectionResult.dmk,
        sessionId: connectionResult.sessionId,
        input: deviceInitializationInput,
        deprecationDismissedCurrencyNames: deprecationDoNotRemind,
      }),
    );
  });

  it("GIVEN the use case emits a non-final state WHEN observing the flow THEN it updates the state", () => {
    // GIVEN
    const subject = setupObservable();
    const { result } = renderViewModel();
    const nextState: EnsureAppReadyState = { type: DeviceInteractionRequiredType.UnlockDevice };

    // WHEN
    act(() => {
      subject.next(nextState);
    });

    // THEN
    expect(result.current.state).toEqual(nextState);
  });

  it("GIVEN the use case succeeds twice WHEN observing the flow THEN it notifies context initialization once", () => {
    // GIVEN
    const subject = setupObservable();
    const onContextInitialized = jest.fn();
    const { result } = renderViewModel({ onContextInitialized });
    const successState: EnsureAppReadyState = {
      type: FinalStateType.Success,
      extractedContext,
    };

    // WHEN
    act(() => {
      subject.next(successState);
      subject.next(successState);
    });

    // THEN
    expect(result.current.state).toEqual(successState);
    expect(onContextInitialized).toHaveBeenCalledTimes(1);
    expect(onContextInitialized).toHaveBeenCalledWith(extractedContext);
  });

  it("GIVEN the use case errors WHEN observing the flow THEN it exposes a final error state", () => {
    // GIVEN
    const subject = setupObservable();
    const { result } = renderViewModel();
    const error = new Error("unexpected");

    // WHEN
    act(() => {
      subject.error(error);
    });

    // THEN
    expect(result.current.state).toEqual({
      type: FinalStateType.Error,
      error,
    });
  });

  it("GIVEN the view model is subscribed WHEN unmounting THEN it unsubscribes from the use case", () => {
    // GIVEN
    const unsubscribe = jest.fn();
    mockedEnsureAppReadyUseCase.mockReturnValue(
      new Observable<EnsureAppReadyState>(() => unsubscribe),
    );
    const { unmount } = renderViewModel();

    // WHEN
    unmount();

    // THEN
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("GIVEN use case side effects WHEN they observe device metadata THEN they update desktop stores", () => {
    // GIVEN
    const { store } = renderViewModel();
    const { sideEffects } = mockedEnsureAppReadyUseCase.mock.calls[0][0];
    const deviceId = DeviceId.fromString("010203");
    const deviceInfo = { version: "2.0.0" } as DeviceInfo;

    // WHEN
    sideEffects.onDeviceIdObserved(deviceId);
    sideEffects.onLastSeenDeviceInfoObserved({
      modelId: DeviceModelId.nanoX,
      deviceInfo,
      latestFirmware: null,
    });

    // THEN
    const state = store.getState();
    expect(state.identities.deviceIds).toHaveLength(1);
    expect(state.identities.deviceIds[0].equals(deviceId)).toBe(true);
    expect(state.settings.lastSeenDevice).toEqual({
      modelId: DeviceModelId.nanoX,
      deviceInfo,
      apps: [],
    });
    expect(state.settings.latestFirmware).toBeNull();
    expect(state.settings.devicesModelList).toContain(DeviceModelId.nanoX);
  });
});
