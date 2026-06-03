import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { FinalStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { track } from "~/analytics";
import { previousRouteNameRef } from "~/analytics/screenRefs";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useFinalErrorViewModel } from "./useFinalErrorViewModel";
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
const TEST_SOURCE = "Portfolio";
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

const error = new Error("boom");
const state = {
  type: FinalStateType.Error,
  error,
} satisfies Extract<EnsureAppReadyState, { type: FinalStateType.Error }>;

describe("useFinalErrorViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    previousRouteNameRef.current = TEST_SOURCE;
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger: jest.fn(),
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding: jest.fn(),
      openSupport,
    });
  });

  it("GIVEN an error WHEN rendering THEN it exposes the view props", () => {
    const { result } = renderHook(() =>
      useFinalErrorViewModel({ state, device, sourceFlow: SOURCE_FLOW, onCancel }),
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        error,
      }),
    );
  });

  it("GIVEN an error WHEN contacting support THEN it tracks Contact Ledger Support and opens support", () => {
    const { result } = renderHook(() =>
      useFinalErrorViewModel({ state, device, sourceFlow: SOURCE_FLOW, onCancel }),
    );

    act(() => {
      result.current.onContactSupport();
    });

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      source: TEST_SOURCE,
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Contact Ledger Support",
    });
    expect(openSupport).toHaveBeenCalledTimes(1);
  });

  it("GIVEN an error WHEN cancelling THEN it tracks Close and forwards to onCancel", () => {
    const { result } = renderHook(() =>
      useFinalErrorViewModel({ state, device, sourceFlow: SOURCE_FLOW, onCancel }),
    );

    act(() => {
      result.current.onCancel();
    });

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      source: TEST_SOURCE,
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Close",
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
