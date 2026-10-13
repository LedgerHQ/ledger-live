import React from "react";
import { render } from "@tests/test-renderer";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { LoadingStateType } from "@ledgerhq/live-dmk-shared";
import type { EnsureAppReadyUseCaseDependencies } from "@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase";
import ContextInitializer from "..";
import { ContextInitializerView } from "../ContextInitializerView";
import { useContextInitializerViewModel } from "../useContextInitializerViewModel";
import type { InitializationInput } from "../../types";

jest.mock("../useContextInitializerViewModel", () => ({
  useContextInitializerViewModel: jest.fn(),
}));

jest.mock("../ContextInitializerView", () => ({
  ContextInitializerView: jest.fn(() => null),
}));

const mockedUseViewModel = jest.mocked(useContextInitializerViewModel);
const mockedView = jest.mocked(ContextInitializerView);

const connectionResult: DeviceConnectionResult = {
  compatDeviceId: "device-id",
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
};

describe("ContextInitializer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseViewModel.mockReturnValue({
      state: { type: LoadingStateType.Loading },
      device: {
        id: "device-id",
        modelId: DeviceModelId.nanoX,
        name: "Ledger Nano X",
        productName: "Ledger Nano X",
        wired: false,
      },
    });
  });

  it("should pass initialization params to the view model when config is omitted", () => {
    const onContextInitialized = jest.fn();

    render(
      <ContextInitializer
        connectionResult={connectionResult}
        deviceInitializationInput={deviceInitializationInput}
        onContextInitialized={onContextInitialized}
        onClose={jest.fn()}
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
      <ContextInitializer
        connectionResult={connectionResult}
        deviceInitializationInput={deviceInitializationInput}
        onContextInitialized={onContextInitialized}
        config={{ dependencies }}
        onClose={jest.fn()}
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

  it("should forward the onClose prop as the view onCancel prop", () => {
    const onClose = jest.fn();

    render(
      <ContextInitializer
        connectionResult={connectionResult}
        deviceInitializationInput={deviceInitializationInput}
        onContextInitialized={jest.fn()}
        onClose={onClose}
      />,
    );

    expect(mockedView).toHaveBeenCalledTimes(1);
    expect(mockedView.mock.calls[0][0].onCancel).toBe(onClose);
  });
});
