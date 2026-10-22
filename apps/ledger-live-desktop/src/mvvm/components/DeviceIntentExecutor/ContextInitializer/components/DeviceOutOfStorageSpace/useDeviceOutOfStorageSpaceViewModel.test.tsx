import { renderHook } from "@testing-library/react";
import { BlockingStateType, DeviceIntentTrackingProvider } from "@ledgerhq/live-dmk-shared";
import React from "react";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { initializerDevice } from "../../testUtils";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import { useDeviceOutOfStorageSpaceViewModel } from "./useDeviceOutOfStorageSpaceViewModel";

jest.mock("../../hooks/useInitializerActions", () => ({
  useInitializerActions: jest.fn(),
}));
jest.mock("../../../utils/trackDeviceIntent", () => ({
  ...jest.requireActual("../../../utils/trackDeviceIntent"),
  trackConnectAppButtonClicked: jest.fn(),
}));

const mockedUseInitializerActions = jest.mocked(useInitializerActions);
const mockedTrackConnectAppButtonClicked = jest.mocked(trackConnectAppButtonClicked);
const openMyLedger = jest.fn();
const wrapper = ({ children }: React.PropsWithChildren) => (
  <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
    {children}
  </DeviceIntentTrackingProvider>
);

describe("useDeviceOutOfStorageSpaceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger,
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding: jest.fn(),
      openSupport: jest.fn(),
      openExperimentalSettings: jest.fn(),
    });
  });

  const renderViewModel = () =>
    renderHook(
      () =>
        useDeviceOutOfStorageSpaceViewModel({
          state: {
            type: BlockingStateType.DeviceOutOfStorageSpace,
            appNames: ["Ethereum", "Bitcoin"],
          },
          device: initializerDevice,
        }),
      { wrapper },
    );

  it("GIVEN multiple apps WHEN rendering THEN it displays all apps", () => {
    // GIVEN
    const { result } = renderViewModel();

    // THEN
    expect(result.current.appNamesText).toBe("Ethereum, Bitcoin");
  });

  it("GIVEN multiple apps WHEN opening My Ledger THEN it searches with all app names", () => {
    // GIVEN
    const { result } = renderViewModel();

    // WHEN
    result.current.onOpenMyLedger();

    // THEN
    expect(openMyLedger).toHaveBeenCalledWith("Ethereum, Bitcoin");
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenCalledWith({
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.ManageApps,
      extraProperties: {},
    });
  });
});
