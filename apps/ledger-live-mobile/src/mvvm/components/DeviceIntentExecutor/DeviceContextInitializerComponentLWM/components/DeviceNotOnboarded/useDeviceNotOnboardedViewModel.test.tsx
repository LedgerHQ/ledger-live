import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { track } from "~/analytics";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useDeviceNotOnboardedViewModel } from "./useDeviceNotOnboardedViewModel";
import type { InitializerDevice } from "../../types";

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
const openOnboarding = jest.fn();

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

describe("useDeviceNotOnboardedViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger: jest.fn(),
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding,
      openSupport: jest.fn(),
    });
  });

  it("GIVEN a device WHEN rendering THEN it exposes the view props", () => {
    const { result } = renderHook(() =>
      useDeviceNotOnboardedViewModel({ device, sourceFlow: SOURCE_FLOW }),
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        productName: "Flex",
      }),
    );
  });

  it("GIVEN a device WHEN invoking setup device THEN it tracks Set Up Device and opens onboarding", () => {
    const { result } = renderHook(() =>
      useDeviceNotOnboardedViewModel({ device, sourceFlow: SOURCE_FLOW }),
    );

    act(() => {
      result.current.onSetupDevice();
    });

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Set Up Device",
    });
    expect(openOnboarding).toHaveBeenCalledTimes(1);
  });
});
