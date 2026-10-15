import { renderHook } from "@testing-library/react";
import { DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared";
import React from "react";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { initializerDevice } from "../../testUtils";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import { useUnsupportedFirmwareVersionViewModel } from "./useUnsupportedFirmwareVersionViewModel";

jest.mock("../../hooks/useInitializerActions", () => ({
  useInitializerActions: jest.fn(),
}));
jest.mock("../../../utils/trackDeviceIntent", () => ({
  ...jest.requireActual("../../../utils/trackDeviceIntent"),
  trackConnectAppButtonClicked: jest.fn(),
}));

const mockedUseInitializerActions = jest.mocked(useInitializerActions);
const mockedTrackConnectAppButtonClicked = jest.mocked(trackConnectAppButtonClicked);
const openMyLedgerFirmwareUpdate = jest.fn();
const wrapper = ({ children }: React.PropsWithChildren) => (
  <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
    {children}
  </DeviceIntentTrackingProvider>
);

describe("useUnsupportedFirmwareVersionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger: jest.fn(),
      openMyLedgerFirmwareUpdate,
      openOnboarding: jest.fn(),
      openSupport: jest.fn(),
      openExperimentalSettings: jest.fn(),
    });
  });

  it("GIVEN an unsupported firmware state WHEN calling onUpdateLedgerOs THEN it opens the firmware update", () => {
    // GIVEN
    const { result } = renderHook(
      () =>
        useUnsupportedFirmwareVersionViewModel({
          device: initializerDevice,
          onCancel: jest.fn(),
        }),
      { wrapper },
    );

    // WHEN
    result.current.onUpdateLedgerOs();

    // THEN
    expect(openMyLedgerFirmwareUpdate).toHaveBeenCalledTimes(1);
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenCalledWith({
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.UpdateFirmware,
      extraProperties: {},
    });
  });

  it("GIVEN an unsupported firmware state WHEN calling onCancel THEN it preserves cancel", () => {
    // GIVEN
    const onCancel = jest.fn();
    const { result } = renderHook(
      () =>
        useUnsupportedFirmwareVersionViewModel({
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
});
