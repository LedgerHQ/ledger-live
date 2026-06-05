import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { track } from "~/analytics";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useWrongDeviceForAccountViewModel } from "./useWrongDeviceForAccountViewModel";
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
const onCancel = jest.fn();

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

describe("useWrongDeviceForAccountViewModel", () => {
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
      useWrongDeviceForAccountViewModel({ device, sourceFlow: SOURCE_FLOW, onCancel }),
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        onCancel: expect.any(Function),
        onContactSupport: expect.any(Function),
      }),
    );
  });

  it("GIVEN a device WHEN cancelling THEN it tracks Close and forwards to onCancel", () => {
    const { result } = renderHook(() =>
      useWrongDeviceForAccountViewModel({ device, sourceFlow: SOURCE_FLOW, onCancel }),
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

  it("GIVEN a device WHEN contacting support THEN it tracks Contact Ledger Support and opens support", () => {
    const { result } = renderHook(() =>
      useWrongDeviceForAccountViewModel({ device, sourceFlow: SOURCE_FLOW, onCancel }),
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
