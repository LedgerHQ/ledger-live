import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import React from "react";
import { track } from "~/analytics";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useInvalidProviderViewModel } from "./useInvalidProviderViewModel";
import type { InitializerDevice } from "../../types";
import { DeviceIntentTrackingProvider } from "../../../utils/DeviceIntentTrackingContext";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    track: jest.fn(),
  };
});

jest.mock("../../hooks/useInitializerActions");

const mockedTrack = jest.mocked(track);
const mockedUseInitializerActions = jest.mocked(useInitializerActions);
const SOURCE_FLOW = "my_ledger";
const openExperimentalSettings = jest.fn();
const wrapper = ({ children }: React.PropsWithChildren) => (
  <DeviceIntentTrackingProvider value={{ sourceFlow: SOURCE_FLOW }}>
    {children}
  </DeviceIntentTrackingProvider>
);

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

describe("useInvalidProviderViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger: jest.fn(),
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding: jest.fn(),
      openSupport: jest.fn(),
      openExperimentalSettings,
    });
  });

  it("GIVEN a device WHEN invoking go to settings THEN it tracks Go To Settings and opens experimental settings", () => {
    const { result } = renderHook(() => useInvalidProviderViewModel({ device }), { wrapper });

    act(() => {
      result.current.onGoToSettings();
    });

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Go To Settings",
    });
    expect(openExperimentalSettings).toHaveBeenCalledTimes(1);
  });
});
