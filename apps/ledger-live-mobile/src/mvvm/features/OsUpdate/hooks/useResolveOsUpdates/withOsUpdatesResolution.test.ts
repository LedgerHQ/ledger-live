import type { ManagerState } from "@ledgerhq/live-common/hw/actions/manager";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { withOsUpdatesResolution } from "./withOsUpdatesResolution";
import { useResolveOsUpdates } from "./index";

jest.mock("./index");

const device = { deviceId: "usb|1" } as Device;
const baseState = {
  isLoading: false,
  error: null,
  isLocked: false,
  device,
  deviceInfo: { version: "1.0.0" },
} as unknown as ManagerState;

const baseAction = { useHook: jest.fn(), mapResult: jest.fn() };
const action = withOsUpdatesResolution(baseAction);

const render = (enabled: boolean) =>
  renderHook(() => action.useHook(device, null), {
    overrideInitialState: withFlagOverrides({ ldmkOsUpdates: { enabled } }),
  });

describe("withOsUpdatesResolution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    baseAction.useHook.mockReturnValue(baseState);
    jest.mocked(useResolveOsUpdates).mockReturnValue(false);
  });

  it("keeps the mapResult of the wrapped action", () => {
    expect(action.mapResult).toBe(baseAction.mapResult);
  });

  it("asks to resolve once the device is ready, only when the flag is enabled", () => {
    render(true);
    expect(useResolveOsUpdates).toHaveBeenCalledWith({
      enabled: true,
      ready: true,
      device,
      deviceInfo: baseState.deviceInfo,
    });

    render(false);
    expect(useResolveOsUpdates).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it.each([
    ["still loading", { isLoading: true }],
    ["in error", { error: new Error("boom") }],
    ["locked", { isLocked: true }],
    ["without device info", { deviceInfo: null }],
  ])("is not ready when the wrapped action is %s", (_label, state) => {
    baseAction.useHook.mockReturnValue({ ...baseState, ...state });

    render(true);

    expect(useResolveOsUpdates).toHaveBeenCalledWith(expect.objectContaining({ ready: false }));
  });

  it("stays loading while the OS updates are being resolved", () => {
    jest.mocked(useResolveOsUpdates).mockReturnValue(true);

    const { result } = render(true);

    expect(result.current).toEqual({ ...baseState, isLoading: true });
  });

  it("returns the wrapped state untouched once resolved", () => {
    const { result } = render(true);

    expect(result.current).toBe(baseState);
  });
});
