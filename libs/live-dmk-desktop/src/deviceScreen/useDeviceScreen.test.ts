import { renderHook, waitFor } from "@testing-library/react";
import { BehaviorSubject } from "rxjs";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { useDeviceScreen } from "./useDeviceScreen";

const activeDeviceSessionSubject = new BehaviorSubject<{ sessionId: string } | null>(null);
const mockGetConnectedDevice = jest.fn();

jest.mock("@ledgerhq/live-dmk-shared", () => ({
  get activeDeviceSessionSubject() {
    return activeDeviceSessionSubject;
  },
}));

jest.mock("../hooks/useDeviceManagementKit", () => ({
  getDeviceManagementKit: () => ({ getConnectedDevice: mockGetConnectedDevice }),
}));

const mockScreenState = { kind: "image", src: "blob:frame", input: {} };
const mockUseScreenPolling = jest.fn(() => mockScreenState);

jest.mock("./useMockServerScreenApi", () => ({ useMockServerScreenApi: () => ({}) }));
jest.mock("./useScreenPolling", () => ({
  useScreenPolling: (...args: unknown[]) => mockUseScreenPolling(...(args as [])),
}));

const anEmulatedDevice = { id: "device-1", modelId: "stax", transport: mockserverIdentifier };

describe("useDeviceScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeDeviceSessionSubject.next(null);
  });

  it("has no device and no screen while nothing is connected", () => {
    const { result } = renderHook(() => useDeviceScreen(true));

    expect(result.current).toEqual({ device: null, state: { kind: "unavailable" } });
  });

  it("exposes the screen of a device driven by the mock server transport", async () => {
    mockGetConnectedDevice.mockReturnValue(anEmulatedDevice);
    activeDeviceSessionSubject.next({ sessionId: "session-1" });

    const { result } = renderHook(() => useDeviceScreen(true));

    await waitFor(() => expect(result.current.device).toBe(anEmulatedDevice));
    expect(result.current.state).toBe(mockScreenState);
  });

  it("ignores a physical device, which has its own screen", async () => {
    mockGetConnectedDevice.mockReturnValue({ ...anEmulatedDevice, transport: "WEB-HID" });
    activeDeviceSessionSubject.next({ sessionId: "session-1" });

    const { result } = renderHook(() => useDeviceScreen(true));

    await waitFor(() => expect(result.current.state).toEqual({ kind: "unavailable" }));
    expect(result.current.device).toBeNull();
  });

  it("survives a session torn down between the emission and the lookup", async () => {
    mockGetConnectedDevice.mockImplementation(() => {
      throw new Error("no such session");
    });
    activeDeviceSessionSubject.next({ sessionId: "stale" });

    const { result } = renderHook(() => useDeviceScreen(true));

    await waitFor(() => expect(result.current.device).toBeNull());
  });

  it("does not poll while the panel is collapsed", async () => {
    mockGetConnectedDevice.mockReturnValue(anEmulatedDevice);
    activeDeviceSessionSubject.next({ sessionId: "session-1" });

    renderHook(() => useDeviceScreen(false));

    await waitFor(() => expect(mockUseScreenPolling).toHaveBeenLastCalledWith({}, false));
  });
});
