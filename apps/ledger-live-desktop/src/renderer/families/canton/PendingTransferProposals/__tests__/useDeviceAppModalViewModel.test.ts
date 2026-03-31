import { act, renderHook } from "tests/testSetup";
import { useDeviceAppModalViewModel } from "../useDeviceAppModalViewModel";

describe("useDeviceAppModalViewModel", () => {
  const mockOnConfirm = jest.fn();
  const mockOnClose = jest.fn();

  const defaultInput = {
    isOpen: false,
    onConfirm: mockOnConfirm,
    action: "accept" as const,
    appName: "Canton",
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialise with pending state and pass through input fields", () => {
    const { result } = renderHook(() => useDeviceAppModalViewModel(defaultInput));

    expect(result.current.confirmationState).toBe("pending");
    expect(result.current.error).toBeNull();
    expect(result.current.request).toEqual({ appName: "Canton" });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.action).toBe("accept");
    expect(result.current.onClose).toBe(mockOnClose);
  });

  it("should reset to pending when isOpen changes to true", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) => useDeviceAppModalViewModel({ ...defaultInput, isOpen }),
      { initialProps: { isOpen: false } },
    );

    rerender({ isOpen: true });

    expect(result.current.confirmationState).toBe("pending");
    expect(result.current.error).toBeNull();
  });

  it("should transition to confirming then completed on successful confirm", async () => {
    mockOnConfirm.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDeviceAppModalViewModel({ ...defaultInput, isOpen: true }),
    );

    await act(async () => {
      result.current.handleDeviceResult({ device: { deviceId: "device-1" } });
    });

    expect(result.current.confirmationState).toBe("completed");
    expect(mockOnConfirm).toHaveBeenCalledWith("device-1");
  });

  it("should transition to error on failed confirm", async () => {
    const testError = new Error("Test failure");
    mockOnConfirm.mockRejectedValue(testError);

    const { result } = renderHook(() =>
      useDeviceAppModalViewModel({ ...defaultInput, isOpen: true }),
    );

    await act(async () => {
      result.current.handleDeviceResult({ device: { deviceId: "device-1" } });
    });

    expect(result.current.confirmationState).toBe("error");
    expect(result.current.error).toBe(testError);
  });

  it("should reset state on retry", async () => {
    const testError = new Error("Test failure");
    mockOnConfirm.mockRejectedValue(testError);

    const { result } = renderHook(() =>
      useDeviceAppModalViewModel({ ...defaultInput, isOpen: true }),
    );

    await act(async () => {
      result.current.handleDeviceResult({ device: { deviceId: "device-1" } });
    });

    expect(result.current.confirmationState).toBe("error");

    act(() => {
      result.current.handleRetry();
    });

    expect(result.current.confirmationState).toBe("pending");
    expect(result.current.error).toBeNull();
  });

  it("should fall back to wired/ble connection type when deviceId is empty", async () => {
    mockOnConfirm.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDeviceAppModalViewModel({ ...defaultInput, isOpen: true }),
    );

    await act(async () => {
      result.current.handleDeviceResult({ device: { deviceId: "", wired: true } });
    });

    expect(mockOnConfirm).toHaveBeenCalledWith("USB");
  });

  it("should fall back to BLE when deviceId is empty and not wired", async () => {
    mockOnConfirm.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDeviceAppModalViewModel({ ...defaultInput, isOpen: true }),
    );

    await act(async () => {
      result.current.handleDeviceResult({ device: { deviceId: "", wired: false } });
    });

    expect(mockOnConfirm).toHaveBeenCalledWith("BLE");
  });

  it("should not call onConfirm when device is undefined in result", async () => {
    const { result } = renderHook(() =>
      useDeviceAppModalViewModel({ ...defaultInput, isOpen: true }),
    );

    await act(async () => {
      result.current.handleDeviceResult({});
    });

    expect(mockOnConfirm).not.toHaveBeenCalled();
    expect(result.current.confirmationState).toBe("pending");
  });
});
