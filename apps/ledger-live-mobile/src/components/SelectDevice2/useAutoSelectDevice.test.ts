import { act, renderHook } from "@testing-library/react-native";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useAutoSelectDevice, Props } from "./useAutoSelectDevice";

// Helper to create mock devices
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
    it("should immediately call onAutoSelect when deviceToAutoSelect is a BLE device", () => {
      const bleDevice = createMockDevice("ble-device-1", { wired: false });

      renderHook(() =>
        useAutoSelectDevice({
          deviceToAutoSelect: bleDevice,
          availableUSBDevice: undefined,
          onAutoSelect: mockOnAutoSelect,
          usbDeviceToSelectExpirationDuration: 100,
          enabled: true,
        }),
      );

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
      expect(mockOnAutoSelect).toHaveBeenCalledWith(bleDevice);
    });

    it("should not call onAutoSelect when deviceToAutoSelect is null", () => {
      renderHook(() =>
        useAutoSelectDevice({
          deviceToAutoSelect: null,
          availableUSBDevice: undefined,
          onAutoSelect: mockOnAutoSelect,
          usbDeviceToSelectExpirationDuration: 100,
          enabled: true,
        }),
      );

      expect(mockOnAutoSelect).not.toHaveBeenCalled();
    });

    it("should not call onAutoSelect when enabled is false", () => {
      renderHook(() =>
        useAutoSelectDevice({
          deviceToAutoSelect: null,
          availableUSBDevice: undefined,
          onAutoSelect: mockOnAutoSelect,
          usbDeviceToSelectExpirationDuration: 100,
          enabled: false,
        }),
      );

      expect(mockOnAutoSelect).not.toHaveBeenCalled();
    });
  });

  describe("USB device auto-selection", () => {
    it("should wait for availableUSBDevice and call onAutoSelect when device matches", () => {
      const usbDevice = createMockDevice("usb-device-to-auto-select", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });
      const availableUSBDevice = createMockDevice("usb-device-available", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });

      const { rerender } = renderHook<unknown, Pick<Props, "availableUSBDevice">>(
        ({ availableUSBDevice }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: usbDevice,
            availableUSBDevice,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { availableUSBDevice: undefined } },
      );

      // Should not be called initially
      expect(mockOnAutoSelect).not.toHaveBeenCalled();

      // When USB device becomes available
      act(() => {
        rerender({ availableUSBDevice });
      });

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
      expect(mockOnAutoSelect).toHaveBeenCalledWith(usbDevice);
    });

    it("should not call onAutoSelect when availableUSBDevice has different modelId", () => {
      const usbDevice = createMockDevice("usb-device-to-auto-select", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });
      const availableUSBDevice = createMockDevice("usb-device-available", {
        wired: true,
        modelId: DeviceModelId.nanoS,
      });

      const { rerender } = renderHook<unknown, Pick<Props, "availableUSBDevice">>(
        ({ availableUSBDevice }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: usbDevice,
            availableUSBDevice,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { availableUSBDevice: undefined } },
      );

      act(() => {
        rerender({ availableUSBDevice });
      });

      expect(mockOnAutoSelect).not.toHaveBeenCalled();
    });

    it("should not call onAutoSelect when USB device expires", () => {
      const usbDevice = createMockDevice("usb-device-to-auto-select", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });
      const availableUSBDevice = createMockDevice("usb-device-available", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });

      const expirationDuration = 100;

      const { rerender } = renderHook<unknown, Pick<Props, "availableUSBDevice">>(
        ({ availableUSBDevice }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: usbDevice,
            availableUSBDevice,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: expirationDuration,
            enabled: true,
          }),
        { initialProps: { availableUSBDevice: undefined } },
      );

      // Fast-forward time past expiration
      act(() => {
        jest.advanceTimersByTime(expirationDuration + 1);
      });

      // Now make device available after expiration
      act(() => {
        rerender({ availableUSBDevice });
      });

      expect(mockOnAutoSelect).not.toHaveBeenCalled();
    });

    it("should call onAutoSelect when USB device becomes available before expiration", () => {
      const usbDevice = createMockDevice("usb-device-1", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });
      const availableUSBDevice = createMockDevice("usb-device-1", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });

      const expirationDuration = 5000;

      const { rerender } = renderHook<unknown, Pick<Props, "availableUSBDevice">>(
        ({ availableUSBDevice }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: usbDevice,
            availableUSBDevice,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: expirationDuration,
            enabled: true,
          }),
        { initialProps: { availableUSBDevice: undefined } },
      );

      // Fast-forward time but not past expiration
      act(() => {
        jest.advanceTimersByTime(expirationDuration - 1000);
      });

      // Make device available before expiration
      act(() => {
        rerender({ availableUSBDevice });
      });

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
      expect(mockOnAutoSelect).toHaveBeenCalledWith(usbDevice);
    });

    it("should only call onAutoSelect once when USB device becomes available", () => {
      const usbDevice = createMockDevice("usb-device-to-auto-select", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });
      const availableUSBDevice = createMockDevice("usb-device-available", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });

      const { rerender } = renderHook<unknown, Pick<Props, "availableUSBDevice">>(
        ({ availableUSBDevice }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: usbDevice,
            availableUSBDevice,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { availableUSBDevice: undefined } },
      );

      // Make device available
      act(() => {
        rerender({ availableUSBDevice });
      });

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);

      // Make device available again (should not trigger another call)
      act(() => {
        rerender({ availableUSBDevice });
      });

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
    });

    it("should not call onAutoSelect when availableUSBDevice changes but no USB device was set to auto-select", () => {
      const availableUSBDevice = createMockDevice("usb-device-1", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });

      const { rerender } = renderHook<unknown, Pick<Props, "availableUSBDevice">>(
        ({ availableUSBDevice }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: null,
            availableUSBDevice,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { availableUSBDevice: undefined } },
      );

      act(() => {
        rerender({ availableUSBDevice });
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
            availableUSBDevice: undefined,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { deviceToAutoSelect: initialDevice } },
      );

      // Initial device should trigger auto-selection
      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
      expect(mockOnAutoSelect).toHaveBeenCalledWith(initialDevice);

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
            availableUSBDevice: undefined,
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
            availableUSBDevice: undefined,
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
            availableUSBDevice: undefined,
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

    it("should handle USB device becoming available multiple times", () => {
      const usbDevice = createMockDevice("usb-device-1", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });
      const availableUSBDevice = createMockDevice("usb-device-1", {
        wired: true,
        modelId: DeviceModelId.nanoX,
      });

      const { rerender } = renderHook<unknown, Pick<Props, "availableUSBDevice">>(
        ({ availableUSBDevice }) =>
          useAutoSelectDevice({
            deviceToAutoSelect: usbDevice,
            availableUSBDevice,
            onAutoSelect: mockOnAutoSelect,
            usbDeviceToSelectExpirationDuration: 100,
            enabled: true,
          }),
        { initialProps: { availableUSBDevice: undefined } },
      );

      // First time device becomes available
      act(() => {
        rerender({ availableUSBDevice });
      });

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);

      // Device becomes unavailable
      act(() => {
        rerender({ availableUSBDevice: undefined });
      });

      // Device becomes available again - should not trigger another call
      act(() => {
        rerender({ availableUSBDevice });
      });

      expect(mockOnAutoSelect).toHaveBeenCalledTimes(1);
    });
  });
});
