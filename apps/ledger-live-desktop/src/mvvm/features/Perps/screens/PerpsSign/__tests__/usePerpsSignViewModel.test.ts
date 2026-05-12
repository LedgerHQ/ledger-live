import { renderHook, act, waitFor } from "tests/testSetup";
import { usePerpsSignViewModel, type PerpsSignData } from "../usePerpsSignViewModel";

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  __esModule: true,
  default: () => ({ connectApp: jest.fn() }),
}));

const mockDevice = { modelId: "stax", deviceId: "device-1", wired: true } as never;

function createMockData(overrides?: Partial<PerpsSignData>): PerpsSignData {
  return {
    appName: "Hyperliquid",
    appOptions: {
      requireLatestFirmware: false,
      allowPartialDependencies: false,
      skipAppInstallIfNotFound: false,
    },
    signFactory: jest.fn().mockResolvedValue({ signatures: [] }),
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  };
}

describe("usePerpsSignViewModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should start in connect phase with no device", () => {
    const data = createMockData();
    const onClose = jest.fn();
    const { result } = renderHook(() => usePerpsSignViewModel(data, onClose));

    expect(result.current.phase).toBe("connect");
    expect(result.current.device).toBeNull();
    expect(result.current.closing).toBe(false);
  });

  it("should transition to sign phase and call signFactory when device is set", async () => {
    const data = createMockData();
    const onClose = jest.fn();
    const { result } = renderHook(() => usePerpsSignViewModel(data, onClose));

    act(() => {
      result.current.handleDeviceResult({ device: mockDevice } as never);
    });

    expect(result.current.phase).toBe("sign");
    expect(result.current.device).toBe(mockDevice);
    await waitFor(() => expect(data.signFactory).toHaveBeenCalledWith(mockDevice));
  });

  it("should call onSuccess and onClose when signFactory resolves", async () => {
    const signatures = [{ r: "0x1", s: "0x2", v: 27 }];
    const data = createMockData({
      signFactory: jest.fn().mockResolvedValue({ signatures }),
    });
    const onClose = jest.fn();
    const { result } = renderHook(() => usePerpsSignViewModel(data, onClose));

    act(() => {
      result.current.handleDeviceResult({ device: mockDevice } as never);
    });

    await waitFor(() => {
      expect(data.onSuccess).toHaveBeenCalledWith({ signatures });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("should call onError and onClose when signFactory rejects", async () => {
    const error = new Error("signing failed");
    const data = createMockData({
      signFactory: jest.fn().mockRejectedValue(error),
    });
    const onClose = jest.fn();
    const { result } = renderHook(() => usePerpsSignViewModel(data, onClose));

    act(() => {
      result.current.handleDeviceResult({ device: mockDevice } as never);
    });

    await waitFor(() => {
      expect(data.onError).toHaveBeenCalledWith(error);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("should call onCancel on unmount when signing has not completed", () => {
    const data = createMockData();
    const onClose = jest.fn();
    const { unmount } = renderHook(() => usePerpsSignViewModel(data, onClose));

    unmount();

    expect(data.onCancel).toHaveBeenCalled();
  });

  it("should not call onCancel on unmount after successful signing", async () => {
    const data = createMockData();
    const onClose = jest.fn();
    const { result, unmount } = renderHook(() => usePerpsSignViewModel(data, onClose));

    act(() => {
      result.current.handleDeviceResult({ device: mockDevice } as never);
    });

    await waitFor(() => expect(data.onSuccess).toHaveBeenCalled());

    unmount();

    expect(data.onCancel).not.toHaveBeenCalled();
  });

  it("should call onError, onClose and set closing on handleDeviceError", () => {
    const data = createMockData();
    const onClose = jest.fn();
    const { result } = renderHook(() => usePerpsSignViewModel(data, onClose));
    const error = new Error("device error");

    act(() => {
      result.current.handleDeviceError(error);
    });

    expect(data.onError).toHaveBeenCalledWith(error);
    expect(onClose).toHaveBeenCalled();
    expect(result.current.closing).toBe(true);
  });

  it("should not call onCancel after handleDeviceError + unmount", () => {
    const data = createMockData();
    const onClose = jest.fn();
    const { result, unmount } = renderHook(() => usePerpsSignViewModel(data, onClose));

    act(() => {
      result.current.handleDeviceError(new Error("fail"));
    });

    unmount();

    expect(data.onCancel).not.toHaveBeenCalled();
  });

  it("should call onClose without onError when handleOpenManager is invoked", () => {
    const data = createMockData();
    const onClose = jest.fn();
    const { result } = renderHook(() => usePerpsSignViewModel(data, onClose));

    act(() => {
      result.current.handleOpenManager();
    });

    expect(onClose).toHaveBeenCalled();
    expect(data.onError).not.toHaveBeenCalled();
    expect(result.current.closing).toBe(true);
  });

  it("should call onCancel after handleOpenManager + unmount", () => {
    const data = createMockData();
    const onClose = jest.fn();
    const { result, unmount } = renderHook(() => usePerpsSignViewModel(data, onClose));

    act(() => {
      result.current.handleOpenManager();
    });

    unmount();

    expect(data.onCancel).toHaveBeenCalledTimes(1);
    expect(data.onError).not.toHaveBeenCalled();
  });

  it("should build request from data app options", () => {
    const data = createMockData({
      appName: "TestApp",
      appOptions: {
        requireLatestFirmware: true,
        allowPartialDependencies: true,
        skipAppInstallIfNotFound: true,
      },
    });
    const onClose = jest.fn();
    const { result } = renderHook(() => usePerpsSignViewModel(data, onClose));

    expect(result.current.request).toEqual({
      appName: "TestApp",
      requireLatestFirmware: true,
      allowPartialDependencies: true,
      skipAppInstallIfNotFound: true,
    });
  });
});
