import type { Observer } from "rxjs";
import { DeviceManagementKitBLETransport } from "@ledgerhq/live-dmk-mobile";
import { act, renderHook } from "@tests/test-renderer";
import { areRealBleAndUsbDisabled } from "~/transport/areRealBleAndUsbDisabled";
import { useEnableBluetooth } from "./useEnableBluetooth";

jest.mock("~/transport/areRealBleAndUsbDisabled", () => ({
  areRealBleAndUsbDisabled: jest.fn(),
}));

type BleStateObserver = Observer<{ type: string; available: boolean }>;

describe("useEnableBluetooth", () => {
  let bleStateObserver: BleStateObserver | undefined;
  let observeStateSpy: jest.SpyInstance;

  beforeEach(() => {
    bleStateObserver = undefined;
    observeStateSpy = jest
      .spyOn(DeviceManagementKitBLETransport, "observeState")
      .mockImplementation(observer => {
        bleStateObserver = observer;
        return { unsubscribe: jest.fn() };
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("GIVEN the real BLE and USB are off, WHEN the hook runs, THEN it should report Bluetooth as enabled without observing the BLE state", () => {
    // GIVEN
    jest.mocked(areRealBleAndUsbDisabled).mockReturnValue(true);

    // WHEN
    const { result } = renderHook(() => useEnableBluetooth());

    // THEN
    expect(result.current.bluetoothServicesState).toBe("enabled");
    expect(observeStateSpy).not.toHaveBeenCalled();
  });

  it("GIVEN the real BLE and USB are on, WHEN the BLE state changes, THEN it should follow the observed state", () => {
    // GIVEN
    jest.mocked(areRealBleAndUsbDisabled).mockReturnValue(false);
    const { result } = renderHook(() => useEnableBluetooth());
    expect(observeStateSpy).toHaveBeenCalledTimes(1);
    expect(result.current.bluetoothServicesState).toBe("unknown");

    // WHEN
    act(() => bleStateObserver?.next({ type: "PoweredOff", available: false }));

    // THEN
    expect(result.current.bluetoothServicesState).toBe("disabled");

    // WHEN
    act(() => bleStateObserver?.next({ type: "PoweredOn", available: true }));

    // THEN
    expect(result.current.bluetoothServicesState).toBe("enabled");
  });
});
