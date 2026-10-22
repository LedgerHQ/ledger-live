import { renderHook } from "@testing-library/react";
import { DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared";
import React from "react";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { initializerDevice } from "../../testUtils";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import { useDeviceNotOnboardedViewModel } from "./useDeviceNotOnboardedViewModel";

jest.mock("../../hooks/useInitializerActions", () => ({
  useInitializerActions: jest.fn(),
}));
jest.mock("../../../utils/trackDeviceIntent", () => ({
  ...jest.requireActual("../../../utils/trackDeviceIntent"),
  trackConnectAppButtonClicked: jest.fn(),
}));

const mockedUseInitializerActions = jest.mocked(useInitializerActions);
const mockedTrackConnectAppButtonClicked = jest.mocked(trackConnectAppButtonClicked);
const openOnboarding = jest.fn();
const wrapper = ({ children }: React.PropsWithChildren) => (
  <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
    {children}
  </DeviceIntentTrackingProvider>
);

describe("useDeviceNotOnboardedViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger: jest.fn(),
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding,
      openSupport: jest.fn(),
      openExperimentalSettings: jest.fn(),
    });
  });

  it("GIVEN a not onboarded device WHEN rendering THEN it exposes the product name", () => {
    // GIVEN
    const { result } = renderHook(
      () => useDeviceNotOnboardedViewModel({ device: initializerDevice }),
      { wrapper },
    );

    // THEN
    expect(result.current.productName).toBe("Ledger Nano X");
  });

  it("GIVEN a not onboarded device WHEN setting up device THEN it opens onboarding", () => {
    // GIVEN
    const { result } = renderHook(
      () => useDeviceNotOnboardedViewModel({ device: initializerDevice }),
      { wrapper },
    );

    // WHEN
    result.current.onSetupDevice();

    // THEN
    expect(openOnboarding).toHaveBeenCalledTimes(1);
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenCalledWith({
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.SetUpDevice,
      extraProperties: {},
    });
  });
});
