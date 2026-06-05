import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { track } from "~/analytics";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useUnsupportedFirmwareVersionViewModel } from "./useUnsupportedFirmwareVersionViewModel";
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
const openMyLedgerFirmwareUpdate = jest.fn();
const onCancel = jest.fn();

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

describe("useUnsupportedFirmwareVersionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger: jest.fn(),
      openMyLedgerFirmwareUpdate,
      openOnboarding: jest.fn(),
      openSupport: jest.fn(),
    });
  });

  it("GIVEN a device WHEN rendering THEN it exposes the view handlers", () => {
    const { result } = renderHook(() =>
      useUnsupportedFirmwareVersionViewModel({
        device,
        sourceFlow: SOURCE_FLOW,
        onCancel,
      }),
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        onCancel: expect.any(Function),
        onUpdateLedgerOs: expect.any(Function),
      }),
    );
  });

  it("GIVEN a device WHEN updating Ledger OS THEN it tracks Update Firmware and opens the firmware update", () => {
    const { result } = renderHook(() =>
      useUnsupportedFirmwareVersionViewModel({
        device,
        sourceFlow: SOURCE_FLOW,
        onCancel,
      }),
    );

    act(() => {
      result.current.onUpdateLedgerOs();
    });

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Update Firmware",
    });
    expect(openMyLedgerFirmwareUpdate).toHaveBeenCalledTimes(1);
  });

  it("GIVEN a device WHEN cancelling THEN it tracks Close and forwards to onCancel", () => {
    const { result } = renderHook(() =>
      useUnsupportedFirmwareVersionViewModel({
        device,
        sourceFlow: SOURCE_FLOW,
        onCancel,
      }),
    );

    act(() => {
      result.current.onCancel();
    });

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Close",
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
