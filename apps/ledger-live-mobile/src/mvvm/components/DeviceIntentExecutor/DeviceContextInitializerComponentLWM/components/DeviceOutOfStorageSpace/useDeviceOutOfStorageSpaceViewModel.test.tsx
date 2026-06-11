import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { track } from "~/analytics";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useDeviceOutOfStorageSpaceViewModel } from "./useDeviceOutOfStorageSpaceViewModel";
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
const openMyLedger = jest.fn();

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

const state = {
  type: BlockingStateType.DeviceOutOfStorageSpace,
  appNames: ["Ethereum", "Bitcoin"],
} satisfies Extract<EnsureAppReadyState, { type: BlockingStateType.DeviceOutOfStorageSpace }>;

describe("useDeviceOutOfStorageSpaceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger,
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding: jest.fn(),
      openSupport: jest.fn(),
    });
  });

  it("GIVEN a device WHEN rendering THEN it exposes the view handlers", () => {
    const { result } = renderHook(() =>
      useDeviceOutOfStorageSpaceViewModel({ state, device, sourceFlow: SOURCE_FLOW }),
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        onOpenMyLedger: expect.any(Function),
      }),
    );
  });

  it("GIVEN missing apps WHEN opening My Ledger THEN it tracks Manage Apps and forwards the app search query", () => {
    const { result } = renderHook(() =>
      useDeviceOutOfStorageSpaceViewModel({ state, device, sourceFlow: SOURCE_FLOW }),
    );

    act(() => {
      result.current.onOpenMyLedger();
    });

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Manage Apps",
    });
    expect(openMyLedger).toHaveBeenCalledWith("Ethereum, Bitcoin");
  });
});
