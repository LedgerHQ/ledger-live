import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  AppInteractionRequiredStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { track } from "~/analytics";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useOutdatedAppWarningViewModel } from "./useOutdatedAppWarningViewModel";
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
const onContinue = jest.fn();

const device: InitializerDevice = {
  id: "device-id",
  modelId: DeviceModelId.europa,
  name: "Lily's Ledger",
  productName: "Flex",
  wired: false,
};

const state = {
  type: AppInteractionRequiredStateType.OutdatedAppWarning,
  appName: "Ethereum",
  onContinue,
} satisfies Extract<
  EnsureAppReadyState,
  { type: AppInteractionRequiredStateType.OutdatedAppWarning }
>;

describe("useOutdatedAppWarningViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger,
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding: jest.fn(),
      openSupport: jest.fn(),
    });
  });

  it("GIVEN an outdated app WHEN rendering THEN it exposes the view props", () => {
    const { result } = renderHook(() =>
      useOutdatedAppWarningViewModel({ state, device, sourceFlow: SOURCE_FLOW }),
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        appName: "Ethereum",
      }),
    );
  });

  it("GIVEN an outdated app WHEN opening My Ledger THEN it tracks Manage Apps and forwards the app name", () => {
    const { result } = renderHook(() =>
      useOutdatedAppWarningViewModel({ state, device, sourceFlow: SOURCE_FLOW }),
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
    expect(openMyLedger).toHaveBeenCalledWith("Ethereum");
  });

  it("GIVEN an outdated app WHEN continuing THEN it tracks Continue and forwards to onContinue", () => {
    const { result } = renderHook(() =>
      useOutdatedAppWarningViewModel({ state, device, sourceFlow: SOURCE_FLOW }),
    );

    act(() => {
      result.current.onContinue();
    });

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      modelId: DeviceModelId.europa,
      button: "Continue",
    });
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
