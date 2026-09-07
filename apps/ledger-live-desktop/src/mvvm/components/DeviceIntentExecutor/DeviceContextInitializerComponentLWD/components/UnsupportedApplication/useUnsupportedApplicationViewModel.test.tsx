import React from "react";
import { renderHook } from "@testing-library/react";
import { DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { initializerDevice } from "../../testUtils";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import { useUnsupportedApplicationViewModel } from "./useUnsupportedApplicationViewModel";

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

describe("useUnsupportedApplicationViewModel", () => {
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

  it("GIVEN an unsupported application state WHEN contacting support THEN it opens support", () => {
    // GIVEN
    const { result } = renderHook(
      () => useUnsupportedApplicationViewModel({ device: initializerDevice }),
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
