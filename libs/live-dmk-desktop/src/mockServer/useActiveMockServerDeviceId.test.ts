import { renderHook, waitFor } from "@testing-library/react";
import { BehaviorSubject } from "rxjs";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { useActiveMockServerDeviceId } from "./useActiveMockServerDeviceId";

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

const anEmulatedDevice = { id: "device-1", transport: mockserverIdentifier };

describe("useActiveMockServerDeviceId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeDeviceSessionSubject.next(null);
  });

  it("is null while nothing is connected", () => {
    const { result } = renderHook(() => useActiveMockServerDeviceId());

    expect(result.current).toBeNull();
  });

  it("is the id of a device driven by the mock server transport", async () => {
    mockGetConnectedDevice.mockReturnValue(anEmulatedDevice);
    activeDeviceSessionSubject.next({ sessionId: "session-1" });

    const { result } = renderHook(() => useActiveMockServerDeviceId());

    await waitFor(() => expect(result.current).toBe("device-1"));
  });

  it("ignores a physical device", async () => {
    mockGetConnectedDevice.mockReturnValue({ ...anEmulatedDevice, transport: "WEB-HID" });
    activeDeviceSessionSubject.next({ sessionId: "session-1" });

    const { result } = renderHook(() => useActiveMockServerDeviceId());

    await waitFor(() => expect(mockGetConnectedDevice).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it("clears the id once the session ends", async () => {
    mockGetConnectedDevice.mockReturnValue(anEmulatedDevice);
    activeDeviceSessionSubject.next({ sessionId: "session-1" });

    const { result } = renderHook(() => useActiveMockServerDeviceId());
    await waitFor(() => expect(result.current).toBe("device-1"));

    activeDeviceSessionSubject.next(null);

    await waitFor(() => expect(result.current).toBeNull());
  });

  it("survives a session torn down between the emission and the lookup", async () => {
    mockGetConnectedDevice.mockImplementation(() => {
      throw new Error("no such session");
    });
    activeDeviceSessionSubject.next({ sessionId: "stale" });

    const { result } = renderHook(() => useActiveMockServerDeviceId());

    await waitFor(() => expect(mockGetConnectedDevice).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });
});
