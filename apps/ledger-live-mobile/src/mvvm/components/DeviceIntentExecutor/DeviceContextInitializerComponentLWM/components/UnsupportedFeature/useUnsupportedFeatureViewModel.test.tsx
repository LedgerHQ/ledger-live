import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { track } from "~/analytics";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useUnsupportedFeatureViewModel } from "./useUnsupportedFeatureViewModel";
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
const openSupport = jest.fn();

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

describe("useUnsupportedFeatureViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger: jest.fn(),
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding: jest.fn(),
      openSupport,
    });
  });

  it("GIVEN a device WHEN rendering THEN it exposes the view handlers", () => {
    const { result } = renderHook(() =>
      useUnsupportedFeatureViewModel({ device, sourceFlow: SOURCE_FLOW }),
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        onContactSupport: expect.any(Function),
      }),
    );
  });

  it("GIVEN a device WHEN contacting support THEN it tracks Contact Ledger Support and opens support", () => {
    const { result } = renderHook(() =>
      useUnsupportedFeatureViewModel({ device, sourceFlow: SOURCE_FLOW }),
    );

    act(() => {
      result.current.onContactSupport();
    });

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Contact Ledger Support",
    });
    expect(openSupport).toHaveBeenCalledTimes(1);
  });
});
