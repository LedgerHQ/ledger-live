import { act, renderHook } from "@testing-library/react-native";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { HIDDiscoveredDevice } from "@ledgerhq/live-dmk-mobile";
import { useAutoSelectDevice, Props } from "./useAutoSelectDevice";
import { DisplayedDevice } from "./DisplayedDevice";

// Helper to create mock Device
const createMockDevice = (
  deviceId: string,
  options: {
    wired?: boolean;
    modelId?: DeviceModelId;
    deviceName?: string | null;
  } = {},
): Device => ({
  deviceId,
  deviceName: options.deviceName ?? `Device ${deviceId}`,
  modelId: options.modelId ?? DeviceModelId.nanoX,
  wired: options.wired ?? false,
});

// Helper to create mock DiscoveredDevice
const createMockDiscoveredDevice = (id: string): DiscoveredDevice =>
  ({ id, name: `Device ${id}`, transport: "USB" }) as DiscoveredDevice;

// Helper to create mock HIDDiscoveredDevice
const createMockHidDevice = (
  deviceId: string,
  options: { modelId?: DeviceModelId; deviceName?: string } = {},
): HIDDiscoveredDevice => ({
  deviceId,
  deviceName: options.deviceName ?? `Device ${deviceId}`,
  modelId: options.modelId ?? DeviceModelId.nanoX,
  wired: true,
  discoveredDevice: createMockDiscoveredDevice(deviceId),
});

describe("useAutoSelectDevice", () => {
  let mockOnAutoSelect: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockOnAutoSelect = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("BLE device auto-selection", () => {
    it("should immediately call onAutoSelect with available: false when deviceToAutoSelect is a BLE device", () => {
      const bleDevice = createMockDevice("ble-device-1", { wired: false });

      renderHook(() =>
        useAutoSelectDevice({
          deviceToAutoSelect: bleDevice,
          hidDevices: [],
          onAutoSelect: mockOnAutoSelect,
          usbDeviceToSelectExpirationDuration: 100,
          enabled: true,
        }),
      );

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
      expect(mockOnAutoSelect).toHaveBeenCalledWith<[DisplayedDevice]>({
        device: bleDevice,
        available: false,
      });
    });

    it("should not call onAutoSelect when deviceToAutoSelect is null", () => {
      renderHook(() =>
        useAutoSelectDevice({
          deviceToAutoSelect: null,
          hidDevices: [],
          onAutoSelect: mockOnAutoSelect,
          usbDeviceToSelectExpirationDuration: 100,
          enabled: true,
        }),
      );

      expect(mockOnAutoSelect).not.toHaveBeenCalled();
    });

    it("should not call onAutoSelect when enabled is false", () => {
      const bleDevice = createMockDevice("ble-device-1", { wired: false });

      renderHook(() =>
        useAutoSelectDevice({
          deviceToAutoSelect: bleDevice,
          hidDevices: [],
          onAutoSelect: mockOnAutoSelect,
          usbDeviceToSelectExpirationDuration: 100,
          enabled: false,
        }),
      );

      expect(mockOnAutoSelect).not.toHaveBeenCalled();
    });
  });

  describe("USB device auto-selection", () => {
    it("should wait for matching hidDevice and call onAutoSelect with DisplayedAvailableDevice", () => {
      const usbDevice = createMockDevice("usb-device-1", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });
      const hidDevice = createMockHidDevice("usb-device-1", {
        modelId: DeviceModelId.nanoX,
      });

      const { rerender } = renderHook<unknown, Pick<Props, "hidDevices">>(
        ({ hidDevices }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: usbDevice,
            hidDevices,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { hidDevices: [] } },
      );

      // Should not be called initially
      expect(mockOnAutoSelect).not.toHaveBeenCalled();

      // When HID device becomes available
      act(() => {
        rerender({ hidDevices: [hidDevice] });
      });

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
      expect(mockOnAutoSelect).toHaveBeenCalledWith({
        device: {
          deviceId: hidDevice.deviceId,
          deviceName: hidDevice.deviceName,
          modelId: hidDevice.modelId,
          wired: true,
        },
        available: true,
        discoveredDevice: hidDevice.discoveredDevice,
      });
    });

    it("should not call onAutoSelect when hidDevice has different modelId", () => {
      const usbDevice = createMockDevice("usb-device-1", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });
      const hidDevice = createMockHidDevice("usb-device-other", {
        modelId: DeviceModelId.nanoS,
      });

      const { rerender } = renderHook<unknown, Pick<Props, "hidDevices">>(
        ({ hidDevices }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: usbDevice,
            hidDevices,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { hidDevices: [] } },
      );

      act(() => {
        rerender({ hidDevices: [hidDevice] });
      });

      expect(mockOnAutoSelect).not.toHaveBeenCalled();
    });

    it("should not call onAutoSelect when USB device expires", () => {
      const usbDevice = createMockDevice("usb-device-1", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });
      const hidDevice = createMockHidDevice("usb-device-1", {
        modelId: DeviceModelId.nanoX,
      });

      const expirationDuration = 100;

      const { rerender } = renderHook<unknown, Pick<Props, "hidDevices">>(
        ({ hidDevices }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: usbDevice,
            hidDevices,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: expirationDuration,
            enabled: true,
          }),
        { initialProps: { hidDevices: [] } },
      );

      // Fast-forward time past expiration
      act(() => {
        jest.advanceTimersByTime(expirationDuration + 1);
      });

      // Now make device available after expiration
      act(() => {
        rerender({ hidDevices: [hidDevice] });
      });

      expect(mockOnAutoSelect).not.toHaveBeenCalled();
    });

    it("should call onAutoSelect when USB device becomes available before expiration", () => {
      const usbDevice = createMockDevice("usb-device-1", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });
      const hidDevice = createMockHidDevice("usb-device-1", {
        modelId: DeviceModelId.nanoX,
      });

      const expirationDuration = 5000;

      const { rerender } = renderHook<unknown, Pick<Props, "hidDevices">>(
        ({ hidDevices }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: usbDevice,
            hidDevices,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: expirationDuration,
            enabled: true,
          }),
        { initialProps: { hidDevices: [] } },
      );

      // Fast-forward time but not past expiration
      act(() => {
        jest.advanceTimersByTime(expirationDuration - 1000);
      });

      // Make device available before expiration
      act(() => {
        rerender({ hidDevices: [hidDevice] });
      });

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
    });

    it("should only call onAutoSelect once when USB device becomes available", () => {
      const usbDevice = createMockDevice("usb-device-1", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });
      const hidDevice = createMockHidDevice("usb-device-1", {
        modelId: DeviceModelId.nanoX,
      });

      const { rerender } = renderHook<unknown, Pick<Props, "hidDevices">>(
        ({ hidDevices }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: usbDevice,
            hidDevices,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { hidDevices: [] } },
      );

      // First time device becomes available
      act(() => {
        rerender({ hidDevices: [hidDevice] });
      });

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);

      // Device becomes unavailable
      act(() => {
        rerender({ hidDevices: [] });
      });

      // Device becomes available again - should not trigger another call
      act(() => {
        rerender({ hidDevices: [hidDevice] });
      });

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
    });

    it("should not call onAutoSelect when hidDevices changes but no USB device was set to auto-select", () => {
      const hidDevice = createMockHidDevice("usb-device-1", {
        modelId: DeviceModelId.nanoX,
      });

      const { rerender } = renderHook<unknown, Pick<Props, "hidDevices">>(
        ({ hidDevices }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: null,
            hidDevices,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { hidDevices: [] } },
      );

      act(() => {
        rerender({ hidDevices: [hidDevice] });
      });

      expect(mockOnAutoSelect).not.toHaveBeenCalled();
    });
  });

  describe("Auto-selection only at mount time", () => {
    it("should not trigger auto-selection when deviceToAutoSelect changes after mount", () => {
      const initialDevice = createMockDevice("device-1", { wired: false });
      const newDevice = createMockDevice("device-2", { wired: false });

      const { rerender } = renderHook<unknown, Pick<Props, "deviceToAutoSelect">>(
        ({ deviceToAutoSelect }) =>
          useAutoSelectDevice({
            deviceToAutoSelect,
            hidDevices: [],
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { deviceToAutoSelect: initialDevice } },
      );

      // Initial device should trigger auto-selection
      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
      expect(mockOnAutoSelect).toHaveBeenCalledWith<[DisplayedDevice]>({
        device: initialDevice,
        available: false,
      });

      // Change deviceToAutoSelect - should not trigger auto-selection
      act(() => {
        rerender({ deviceToAutoSelect: newDevice });
      });

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
    });

    it("should not trigger auto-selection when deviceToAutoSelect changes from null to device after mount", () => {
      const newDevice = createMockDevice("device-1", { wired: false });

      const { rerender } = renderHook<unknown, Pick<Props, "deviceToAutoSelect">>(
        ({ deviceToAutoSelect }) =>
          useAutoSelectDevice({
            deviceToAutoSelect,
            hidDevices: [],
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { deviceToAutoSelect: null } },
      );

      expect(mockOnAutoSelect).not.toHaveBeenCalled();

      // Change deviceToAutoSelect from null to device - should not trigger auto-selection
      act(() => {
        rerender({ deviceToAutoSelect: newDevice });
      });

      expect(mockOnAutoSelect).not.toHaveBeenCalled();
    });

    it("should not trigger auto-selection when onAutoSelect callback changes after mount", () => {
      const bleDevice = createMockDevice("device-1", { wired: false });
      const newOnAutoSelect = jest.fn();

      const { rerender } = renderHook<unknown, Pick<Props, "onAutoSelect">>(
        ({ onAutoSelect }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: bleDevice,
            hidDevices: [],
            onAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { onAutoSelect: mockOnAutoSelect } },
      );

      // Initial callback should be called
      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);

      // Change callback - should not trigger auto-selection again
      act(() => {
        rerender({ onAutoSelect: newOnAutoSelect });
      });

      expect(newOnAutoSelect).not.toHaveBeenCalled();
      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge cases", () => {
    it("should handle multiple rerenders without triggering multiple auto-selections for BLE device", () => {
      const bleDevice = createMockDevice("device-1", { wired: false });

      const { rerender } = renderHook<unknown, Pick<Props, "deviceToAutoSelect">>(
        ({ deviceToAutoSelect }) =>
          useAutoSelectDevice({
            deviceToAutoSelect,
            hidDevices: [],
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { deviceToAutoSelect: bleDevice } },
      );

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);

      // Multiple rerenders should not trigger more calls
      act(() => {
        rerender({ deviceToAutoSelect: bleDevice });
      });
      act(() => {
        rerender({ deviceToAutoSelect: bleDevice });
      });
      act(() => {
        rerender({ deviceToAutoSelect: bleDevice });
      });

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
    });

    it("should handle USB hidDevices becoming available multiple times", () => {
      const usbDevice = createMockDevice("usb-device-1", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });
      const hidDevice = createMockHidDevice("usb-device-1", {
        modelId: DeviceModelId.nanoX,
      });

      const { rerender } = renderHook<unknown, Pick<Props, "hidDevices">>(
        ({ hidDevices }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: usbDevice,
            hidDevices,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { hidDevices: [] } },
      );

      // First time device becomes available
      act(() => {
        rerender({ hidDevices: [hidDevice] });
      });

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);

      // Device becomes unavailable
      act(() => {
        rerender({ hidDevices: [] });
      });

      // Device becomes available again - should not trigger another call
      act(() => {
        rerender({ hidDevices: [hidDevice] });
      });

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
    });
  });
});
