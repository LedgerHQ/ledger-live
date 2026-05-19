import React from "react";
import { render } from "@tests/test-renderer";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { LoadingStateType } from "@ledgerhq/live-dmk-shared";
import type { EnsureAppReadyUseCaseDependencies } from "@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase";
import DeviceContextInitializerComponentLWM from "..";
import { useDeviceContextInitializerComponentLWMViewModel } from "../useDeviceContextInitializerComponentLWMViewModel";
import type { InitializationInput } from "../../types";

jest.mock("../useDeviceContextInitializerComponentLWMViewModel", () => ({
  useDeviceContextInitializerComponentLWMViewModel: jest.fn(),
}));

const mockedUseViewModel = jest.mocked(useDeviceContextInitializerComponentLWMViewModel);

const connectionResult: DeviceConnectionResult = {
  compatDeviceId: "device-id",
  compatDeviceModelId: DeviceModelId.nanoX,
  compatDeviceName: "Ledger Nano X",
  compatDeviceWired: false,
  connectedDevice: Object.create(null),
  dmk: Object.create(null),
  sessionId: "session-1",
};

const deviceInitializationInput: InitializationInput = {
  appName: "Ethereum",
  dependencies: ["1inch"],
  requireLatestFirmware: false,
  allowPartialDependencies: false,
};

describe("DeviceContextInitializerComponentLWM", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseViewModel.mockReturnValue({ type: LoadingStateType.Loading });
  });

  it("should pass initialization params to the view model when config is omitted", () => {
    const onContextInitialized = jest.fn();

    render(
      <DeviceContextInitializerComponentLWM
        connectionResult={connectionResult}
        deviceInitializationInput={deviceInitializationInput}
        onContextInitialized={onContextInitialized}
      />,
    );

    expect(mockedUseViewModel).toHaveBeenCalledTimes(1);
    expect(mockedUseViewModel).toHaveBeenCalledWith({
      connectionResult,
      deviceInitializationInput,
      onContextInitialized,
      dependencies: undefined,
    });
  });

  it("should pass dependencies from config to the view model", () => {
    const onContextInitialized = jest.fn();
    const dependencies: Partial<EnsureAppReadyUseCaseDependencies> = {};

    render(
      <DeviceContextInitializerComponentLWM
        connectionResult={connectionResult}
        deviceInitializationInput={deviceInitializationInput}
        onContextInitialized={onContextInitialized}
        config={{ dependencies }}
      />,
    );

    expect(mockedUseViewModel).toHaveBeenCalledTimes(1);
    expect(mockedUseViewModel).toHaveBeenCalledWith({
      connectionResult,
      deviceInitializationInput,
      onContextInitialized,
      dependencies,
    });
  });
});
