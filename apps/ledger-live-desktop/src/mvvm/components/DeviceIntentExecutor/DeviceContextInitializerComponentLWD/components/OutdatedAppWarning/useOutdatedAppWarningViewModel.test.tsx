import React from "react";
import { renderHook } from "@testing-library/react";
import {
  AppInteractionRequiredStateType,
  DeviceIntentTrackingProvider,
} from "@ledgerhq/live-dmk-shared";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { initializerDevice } from "../../testUtils";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import { useOutdatedAppWarningViewModel } from "./useOutdatedAppWarningViewModel";

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

describe("useOutdatedAppWarningViewModel", () => {
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

  const renderViewModel = (onContinue = jest.fn()) =>
    renderHook(
      () =>
        useOutdatedAppWarningViewModel({
          state: {
            type: AppInteractionRequiredStateType.OutdatedAppWarning,
            appName: "Ethereum",
            onContinue,
          },
          device: initializerDevice,
        }),
      { wrapper },
    );

  it("GIVEN an outdated app warning WHEN rendering THEN it exposes the app name", () => {
    // GIVEN
    const { result } = renderViewModel();

    // THEN
    expect(result.current.appName).toBe("Ethereum");
  });

  it("GIVEN an outdated app warning WHEN calling onOpenMyLedger THEN it opens Manager for the app", () => {
    // GIVEN
    const { result } = renderViewModel();

    // WHEN
    result.current.onOpenMyLedger();

    // THEN
    expect(openMyLedger).toHaveBeenCalledWith("Ethereum");
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenCalledWith({
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.ManageApps,
      extraProperties: {},
    });
  });

  it("GIVEN an outdated app warning WHEN calling onContinue THEN it preserves continue", () => {
    // GIVEN
    const onContinue = jest.fn();
    const { result } = renderViewModel(onContinue);

    // WHEN
    result.current.onContinue();

    // THEN
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(mockedTrackConnectAppButtonClicked).toHaveBeenCalledWith({
      sourceFlow: "my_ledger",
      modelId: initializerDevice.modelId,
      button: CONNECT_APP_BUTTON.Continue,
      extraProperties: {},
    });
  });
});
