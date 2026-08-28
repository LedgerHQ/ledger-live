import { renderHook } from "@testing-library/react";
import {
  BlockingStateType,
  DeviceIntentTrackingProvider,
  FinalStateType,
} from "@ledgerhq/live-dmk-shared";
import React from "react";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { initializerDevice } from "../../testUtils";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import { useFinalErrorViewModel } from "./useFinalErrorViewModel";

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

describe("useFinalErrorViewModel", () => {
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

  it("GIVEN a final error state WHEN rendering THEN it exposes the error", () => {
    // GIVEN
    const error = new Error("unexpected");
    const { result } = renderHook(
      () =>
        useFinalErrorViewModel({
          state: { type: FinalStateType.Error, error },
          device: initializerDevice,
          onCancel: jest.fn(),
        }),
      { wrapper },
    );

    // THEN
    expect(result.current.error).toBe(error);
  });

  it("GIVEN a final error state WHEN calling onContactSupport THEN it opens support", () => {
    // GIVEN
    const { result } = renderHook(
      () =>
        useFinalErrorViewModel({
          state: { type: FinalStateType.Error, error: new Error("unexpected") },
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

  it("GIVEN a final error state WHEN calling onCancel THEN it wires cancel", () => {
    // GIVEN
    const onCancel = jest.fn();
    const { result } = renderHook(
      () =>
        useFinalErrorViewModel({
          state: { type: FinalStateType.Error, error: new Error("unexpected") },
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

  it("GIVEN an unknown final error WHEN rendering THEN it exposes a generic error", () => {
    // WHEN
    const { result } = renderHook(
      () =>
        useFinalErrorViewModel({
          state: {
            type: FinalStateType.Error,
            error: { type: BlockingStateType.UnsupportedFeature },
          },
          device: initializerDevice,
          onCancel: jest.fn(),
        }),
      { wrapper },
    );

    // THEN
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe("Unknown error");
  });
});
