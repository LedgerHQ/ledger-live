import { renderHook, act, waitFor } from "@tests/test-renderer";
import { usePerpsSignViewModel } from "../usePerpsSignViewModel";

jest.mock("~/hooks/deviceActions", () => ({
  useAppDeviceAction: () => ({ action: "mock-action" }),
}));

const mockDevice = { modelId: "stax", deviceId: "device-1", wired: true } as never;

function createNavigationProps(overrides: Record<string, unknown> = {}) {
  return {
    navigation: {
      goBack: jest.fn(),
      setOptions: jest.fn(),
    },
    route: {
      params: {
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
        onClose: jest.fn(),
        ...overrides,
      },
    },
  } as never;
}

describe("usePerpsSignViewModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should start with no selected device and drawer closed", () => {
    const props = createNavigationProps();
    const { result } = renderHook(() => usePerpsSignViewModel(props));

    expect(result.current.selectedDevice).toBeUndefined();
    expect(result.current.connectedDevice).toBeNull();
    expect(result.current.drawerOpen).toBe(false);
  });

  it("should open drawer when a device is selected", () => {
    const props = createNavigationProps();
    const { result } = renderHook(() => usePerpsSignViewModel(props));

    act(() => {
      result.current.setSelectedDevice(mockDevice);
    });

    expect(result.current.drawerOpen).toBe(true);
  });

  it("should call signFactory when device connects via handleAppResult", async () => {
    const signFactory = jest.fn().mockResolvedValue({ signatures: [] });
    const props = createNavigationProps({ signFactory });
    const { result } = renderHook(() => usePerpsSignViewModel(props));

    act(() => {
      result.current.setSelectedDevice(mockDevice);
    });

    act(() => {
      result.current.handleAppResult({ device: mockDevice } as never);
    });

    await waitFor(() => expect(signFactory).toHaveBeenCalledWith(mockDevice));
  });

  it("should call onSuccess when signFactory resolves", async () => {
    const signatures = [{ r: "0x1", s: "0x2", v: 27 }];
    const onSuccess = jest.fn();
    const props = createNavigationProps({
      signFactory: jest.fn().mockResolvedValue({ signatures }),
      onSuccess,
    });
    const { result } = renderHook(() => usePerpsSignViewModel(props));

    act(() => {
      result.current.handleAppResult({ device: mockDevice } as never);
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ signatures });
    });
  });

  it("should call onError when signFactory rejects", async () => {
    const error = new Error("signing failed");
    const onError = jest.fn();
    const props = createNavigationProps({
      signFactory: jest.fn().mockRejectedValue(error),
      onError,
    });
    const { result } = renderHook(() => usePerpsSignViewModel(props));

    act(() => {
      result.current.handleAppResult({ device: mockDevice } as never);
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it("should call onCancel on unmount when signing has not completed", () => {
    const props = createNavigationProps();
    const { unmount } = renderHook(() => usePerpsSignViewModel(props));

    unmount();

    expect((props as { route: { params: { onCancel: jest.Mock } } }).route.params.onCancel).toHaveBeenCalled();
  });

  it("should not call onCancel after successful signing + unmount", async () => {
    const onSuccess = jest.fn();
    const onCancel = jest.fn();
    const props = createNavigationProps({ onSuccess, onCancel });
    const { result, unmount } = renderHook(() => usePerpsSignViewModel(props));

    act(() => {
      result.current.handleAppResult({ device: mockDevice } as never);
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    unmount();

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("should reset device state and call onCancel on handleDrawerClose", () => {
    const onCancel = jest.fn();
    const props = createNavigationProps({ onCancel });
    const { result } = renderHook(() => usePerpsSignViewModel(props));

    act(() => {
      result.current.setSelectedDevice(mockDevice);
    });
    expect(result.current.drawerOpen).toBe(true);

    act(() => {
      result.current.handleDrawerClose();
    });

    expect(result.current.selectedDevice).toBeUndefined();
    expect(result.current.connectedDevice).toBeNull();
    expect(onCancel).toHaveBeenCalled();
  });

  it("should not call onCancel on handleDrawerClose after successful signing", async () => {
    const onCancel = jest.fn();
    const onSuccess = jest.fn();
    const props = createNavigationProps({ onCancel, onSuccess });
    const { result } = renderHook(() => usePerpsSignViewModel(props));

    act(() => {
      result.current.handleAppResult({ device: mockDevice } as never);
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    act(() => {
      result.current.handleDrawerClose();
    });

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("should navigate back on handleDrawerHidden when signing completed", async () => {
    const onSuccess = jest.fn();
    const navigation = { goBack: jest.fn(), setOptions: jest.fn() };
    const props = {
      navigation,
      route: {
        params: {
          appName: "Hyperliquid",
          signFactory: jest.fn().mockResolvedValue({ signatures: [] }),
          onSuccess,
          onError: jest.fn(),
          onCancel: jest.fn(),
          onClose: jest.fn(),
        },
      },
    } as never;

    const { result } = renderHook(() => usePerpsSignViewModel(props));

    act(() => {
      result.current.handleAppResult({ device: mockDevice } as never);
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    act(() => {
      result.current.handleDrawerHidden();
    });

    expect(navigation.goBack).toHaveBeenCalled();
  });
});
