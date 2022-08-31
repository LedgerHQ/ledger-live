import { renderHook, act } from "@testing-library/react-hooks";
import type {
  Observer as TransportObserver,
  Subscription as TransportSubscription,
  DescriptorEvent,
} from "@ledgerhq/hw-transport";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { useBleDevicesScanning } from "./useBleDevicesScanning";
import type { TransportBleDevice } from "../types";

jest.useFakeTimers();

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const nanoXServiceUuid = getDeviceModel(DeviceModelId.nanoX).bluetoothSpec![0]
  .serviceUuid;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const nanoFTSServiceUuid = getDeviceModel(DeviceModelId.nanoFTS)
  .bluetoothSpec![0].serviceUuid;

// Fake devices info we would get from the bluetooth transport listen
const aTransportBleDevice = (overrideProps?: Partial<TransportBleDevice>) => {
  return {
    id: "aBleNanoId",
    name: "aBleNano",
    localName: null,
    rssi: 50,
    mtu: 50,
    serviceUUIDs: [nanoXServiceUuid],
    ...overrideProps,
  };
};

type bleTransportListenObserver = TransportObserver<
  DescriptorEvent<TransportBleDevice | null>
>;

// HOF creating a mocked Transport listen method to be given to useBleDevicesScanning
const setupMockBleTransportListen =
  (mockEmitValuesByObserver: (observer: bleTransportListenObserver) => void) =>
  (observer: bleTransportListenObserver): TransportSubscription => {
    mockEmitValuesByObserver(observer);

    const unsubscribe = () => {};

    return {
      unsubscribe,
    };
  };

describe("useBleDevicesScanning", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("When several unique devices are found by the scanner", () => {
    const deviceIdA = "ID_A";
    const deviceIdB = "ID_B";
    const deviceIdC = "ID_C";

    const mockEmitValuesByObserver = (observer: bleTransportListenObserver) => {
      observer.next({
        type: "add",
        descriptor: aTransportBleDevice({ id: deviceIdA }),
      });

      setTimeout(() => {
        observer.next({
          type: "add",
          descriptor: aTransportBleDevice({
            id: deviceIdB,
            serviceUUIDs: [nanoFTSServiceUuid],
          }),
        });
      }, 1000);

      setTimeout(() => {
        observer.next({
          type: "add",
          descriptor: aTransportBleDevice({ id: deviceIdC }),
        });
      }, 2000);
    };

    describe("and when no filters are applied to the scanning", () => {
      it("should update the list of scanned devices for each new scanned device", async () => {
        const { result } = renderHook(() =>
          useBleDevicesScanning({
            bleTransportListen: setupMockBleTransportListen(
              mockEmitValuesByObserver
            ),
          })
        );

        expect(result.current.scannedDevices).toHaveLength(1);
        expect(result.current.scannedDevices[0].deviceId).toBe(deviceIdA);
        // The model was correctly deduced from the ble spec
        expect(result.current.scannedDevices[0].deviceModel.id).toBe(
          DeviceModelId.nanoX
        );

        await act(async () => {
          jest.advanceTimersByTime(1000);
        });

        expect(result.current.scannedDevices).toHaveLength(2);
        expect(result.current.scannedDevices[1].deviceId).toBe(deviceIdB);
        expect(result.current.scannedDevices[1].deviceModel.id).toBe(
          DeviceModelId.nanoFTS
        );
      });
    });

    describe("and when filterByDeviceModelIds is not null", () => {
      it("should filter the scanning result by the given model ids", async () => {
        const { result } = renderHook(() =>
          useBleDevicesScanning({
            bleTransportListen: setupMockBleTransportListen(
              mockEmitValuesByObserver
            ),
            filterByDeviceModelIds: [DeviceModelId.nanoX],
          })
        );

        // The first scanned device was a nanoX
        expect(result.current.scannedDevices).toHaveLength(1);
        expect(result.current.scannedDevices[0].deviceId).toBe(deviceIdA);
        // The model was correctly deduced from the ble spec
        expect(result.current.scannedDevices[0].deviceModel.id).toBe(
          DeviceModelId.nanoX
        );

        await act(async () => {
          jest.advanceTimersByTime(1000);
        });

        // The second scanned device was a nanoFTS, and was filtered out
        expect(result.current.scannedDevices).toHaveLength(1);

        await act(async () => {
          jest.advanceTimersByTime(1000);
        });

        // The third scanned device was a nanoX
        expect(result.current.scannedDevices).toHaveLength(2);
        expect(result.current.scannedDevices[1].deviceId).toBe(deviceIdC);
        expect(result.current.scannedDevices[1].deviceModel.id).toBe(
          DeviceModelId.nanoX
        );
      });
    });

    describe("and when filterOutDevicesByDeviceIds is not null nor empty", () => {
      it("should not add the scanned device if its ids is in the array", async () => {
        const { result } = renderHook(() =>
          useBleDevicesScanning({
            bleTransportListen: setupMockBleTransportListen(
              mockEmitValuesByObserver
            ),
            filterOutDevicesByDeviceIds: [deviceIdA, deviceIdC],
          })
        );

        // The first scanned device (deviceIdA) should be filtered out
        expect(result.current.scannedDevices).toHaveLength(0);

        await act(async () => {
          jest.advanceTimersByTime(1000);
        });

        // The second scanned device is deviceIdB and should be kept
        expect(result.current.scannedDevices).toHaveLength(1);
        expect(result.current.scannedDevices[0].deviceId).toBe(deviceIdB);

        await act(async () => {
          jest.advanceTimersByTime(1000);
        });

        // The third scanned device (deviceIdC) should be filtered out
        expect(result.current.scannedDevices).toHaveLength(1);
      });
    });

    describe("and when the hook consumer stops the scanning", () => {
      it("should stop the scanning", async () => {
        let stopBleScanning = false;

        const { result, rerender } = renderHook(() =>
          useBleDevicesScanning({
            bleTransportListen: setupMockBleTransportListen(
              mockEmitValuesByObserver
            ),
            stopBleScanning,
          })
        );

        // At first the scanning finds device(s)
        expect(result.current.scannedDevices).toHaveLength(1);
        expect(result.current.scannedDevices[0].deviceId).toBe(deviceIdA);
        expect(result.current.scannedDevices[0].deviceModel.id).toBe(
          DeviceModelId.nanoX
        );

        // Then the consumer stops the scanning
        stopBleScanning = true;
        rerender({
          bleTransportListen: setupMockBleTransportListen(
            mockEmitValuesByObserver
          ),
          stopBleScanning,
        });

        await act(async () => {
          jest.advanceTimersByTime(2000);
        });

        // It should not find any new devices
        expect(result.current.scannedDevices).toHaveLength(1);
      });
    });
  });

  describe("When the same device is being scanned several times", () => {
    const deviceIdA = "ID_A";
    const deviceIdB = "ID_B";

    const mockEmitValuesByObserver = (observer: bleTransportListenObserver) => {
      observer.next({
        type: "add",
        descriptor: aTransportBleDevice({ id: deviceIdA }),
      });

      setTimeout(() => {
        observer.next({
          type: "add",
          descriptor: aTransportBleDevice({ id: deviceIdA }),
        });
      }, 1000);

      setTimeout(() => {
        observer.next({
          type: "add",
          descriptor: aTransportBleDevice({ id: deviceIdB }),
        });
      }, 2000);
    };

    it("should update the list of scanned devices without any duplicate", async () => {
      const { result } = renderHook(() =>
        useBleDevicesScanning({
          bleTransportListen: setupMockBleTransportListen(
            mockEmitValuesByObserver
          ),
        })
      );

      // The first time it gets the device from the scanning
      expect(result.current.scannedDevices).toHaveLength(1);
      expect(result.current.scannedDevices[0].deviceId).toBe(deviceIdA);
      expect(result.current.scannedDevices[0].deviceModel.id).toBe(
        DeviceModelId.nanoX
      );

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // The second time it gets the same device from the scanning
      // It should not have been added to the list
      expect(result.current.scannedDevices).toHaveLength(1);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // The third time it gets a new device
      expect(result.current.scannedDevices).toHaveLength(2);
      expect(result.current.scannedDevices[1].deviceId).toBe(deviceIdB);
      expect(result.current.scannedDevices[1].deviceModel.id).toBe(
        DeviceModelId.nanoX
      );
    });
  });
});
