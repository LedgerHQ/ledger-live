import { renderHook } from "@testing-library/react";
import { DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared";
import React from "react";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { initializerDevice } from "../../testUtils";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import { useWrongDeviceForAccountViewModel } from "./useWrongDeviceForAccountViewModel";

jest.mock("../../hooks/useInitializerActions", () => ({
  useInitializerActions: jest.fn(),
}));
jest.mock("../../../utils/trackDeviceIntent", () => ({
  ...jest.requireActual("../../../utils/trackDeviceIntent"),
  trackConnectAppButtonClicked: jest.fn(),
}));

const mockedUseInitializerActions = jest.mocked(useInitializerActions);
const mockedTrackConnectAppButtonClicked = jest.mocked(trackConnectAppButtonClicked);
const openSupport = jest.fn();
const wrapper = ({ children }: React.PropsWithChildren) => (
  <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
    {children}
  </DeviceIntentTrackingProvider>
);

describe("useWrongDeviceForAccountViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger: jest.fn(),
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding: jest.fn(),
      openSupport,
      openExperimentalSettings: jest.fn(),
    });
  });

  it("GIVEN a wrong device state WHEN calling onCancel THEN it cancels", () => {
    // GIVEN
    const onCancel = jest.fn();
    const { result } = renderHook(
      () =>
        useWrongDeviceForAccountViewModel({
          device: initializerDevice,
          onCancel,
        }),
      { wrapper },
    );

    // WHEN
    result.current.onCancel();

    // THEN
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenCalledWith({
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.Close,
      extraProperties: {},
    });
  });

  it("GIVEN a wrong device state WHEN calling onContactSupport THEN it opens support", () => {
    // GIVEN
    const { result } = renderHook(
      () =>
        useWrongDeviceForAccountViewModel({
          device: initializerDevice,
          onCancel: jest.fn(),
        }),
      { wrapper },
    );

    // WHEN
    result.current.onContactSupport();

    // THEN
    expect(openSupport).toHaveBeenCalledTimes(1);
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenCalledWith({
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.ContactLedgerSupport,
      extraProperties: {},
    });
  });
});
