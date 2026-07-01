import React from "react";
import { LoadingStateType } from "@ledgerhq/live-dmk-shared";
import type { EnsureAppReadyUseCaseDependencies } from "@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase";
import { render } from "@testing-library/react";
import DeviceContextInitializerComponentLWD from "..";
import { DeviceContextInitializerComponentLWDView } from "../DeviceContextInitializerComponentLWDView";
import { useDeviceContextInitializerComponentLWDViewModel } from "../useDeviceContextInitializerComponentLWDViewModel";
import { connectionResult, deviceInitializationInput, initializerDevice } from "../testUtils";

jest.mock("../useDeviceContextInitializerComponentLWDViewModel", () => ({
  useDeviceContextInitializerComponentLWDViewModel: jest.fn(),
}));

jest.mock("../DeviceContextInitializerComponentLWDView", () => ({
  DeviceContextInitializerComponentLWDView: jest.fn(() => null),
}));

const mockedUseViewModel = jest.mocked(useDeviceContextInitializerComponentLWDViewModel);
const mockedView = jest.mocked(DeviceContextInitializerComponentLWDView);

describe("DeviceContextInitializerComponentLWD", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseViewModel.mockReturnValue({
      state: { type: LoadingStateType.Loading },
      device: initializerDevice,
    });
  });

  it("GIVEN no initializer config WHEN rendering THEN it passes initialization params to the view model", () => {
    // GIVEN
    const onContextInitialized = jest.fn();

    // WHEN
    render(
      <DeviceContextInitializerComponentLWD
        connectionResult={connectionResult}
        deviceInitializationInput={deviceInitializationInput}
        onContextInitialized={onContextInitialized}
        onClose={jest.fn()}
      />,
    );

    // THEN
    expect(mockedUseViewModel).toHaveBeenCalledTimes(1);
    expect(mockedUseViewModel).toHaveBeenCalledWith({
      connectionResult,
      deviceInitializationInput,
      onContextInitialized,
      dependencies: undefined,
    });
  });

  it("GIVEN initializer config dependencies WHEN rendering THEN it forwards dependencies to the view model", () => {
    // GIVEN
    const onContextInitialized = jest.fn();
    const dependencies: Partial<EnsureAppReadyUseCaseDependencies> = {};

    // WHEN
    render(
      <DeviceContextInitializerComponentLWD
        connectionResult={connectionResult}
        deviceInitializationInput={deviceInitializationInput}
        onContextInitialized={onContextInitialized}
        config={{ dependencies }}
        onClose={jest.fn()}
      />,
    );

    // THEN
    expect(mockedUseViewModel).toHaveBeenCalledTimes(1);
    expect(mockedUseViewModel).toHaveBeenCalledWith({
      connectionResult,
      deviceInitializationInput,
      onContextInitialized,
      dependencies,
    });
  });

  it("GIVEN the executor close callback WHEN rendering THEN it forwards it as the view cancel callback", () => {
    // GIVEN
    const onClose = jest.fn();

    // WHEN
    render(
      <DeviceContextInitializerComponentLWD
        connectionResult={connectionResult}
        deviceInitializationInput={deviceInitializationInput}
        onContextInitialized={jest.fn()}
        onClose={onClose}
      />,
    );

    // THEN
    expect(mockedView).toHaveBeenCalledTimes(1);
    expect(mockedView.mock.calls[0][0].onCancel).toBe(onClose);
  });
});
