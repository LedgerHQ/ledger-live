import { of, Subject, Observable } from "rxjs";
import {
  ConnectedDevice,
  DeviceModelId,
  DeviceStatus,
  DiscoveredDevice,
  DeviceSessionState,
  DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { DeviceManagementKitTransport } from "./DeviceManagementKitTransport";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";

let obs: Subject<DeviceSessionState> = new Subject<DeviceSessionState>();
let transport: DeviceManagementKitTransport;
let deviceManagementKit: DeviceManagementKit;

describe("DeviceManagementKitTransport", () => {
  const mockObserver = {
    next: jest.fn(),
    error: jest.fn(),
    complete: jest.fn(),
  };

  const testDevice1 = {
    id: "dev1",
    deviceModel: { model: "model1" },
  } as unknown as DiscoveredDevice;
  const testDevice2 = {
    id: "dev2",
    deviceModel: { model: "model1" },
  } as unknown as DiscoveredDevice;
  const connectedDevice1 = {
    id: "dev1",
    sessionId: "session1",
  } as unknown as ConnectedDevice;

  beforeAll(async () => {
    deviceManagementKit = getDeviceManagementKit();
    jest.spyOn(deviceManagementKit, "listenToAvailableDevices").mockImplementation(() => {
      return of<DiscoveredDevice[]>([
        {
          id: `test-123`,
          deviceModel: {
            id: `stax-123`,
            model: DeviceModelId.STAX,
            name: "stax",
          },
          rssi: undefined,
          name: "",
          transport: "web-hid",
        },
      ]);
    });
    jest.spyOn(deviceManagementKit, "connect").mockResolvedValue(`session-123`);
    jest.spyOn(deviceManagementKit, "getDeviceSessionState").mockImplementation(() => {
      obs.next({
        deviceStatus: DeviceStatus.CONNECTED,
      } as DeviceSessionState);
      return obs;
    });

    transport = await DeviceManagementKitTransport.open();
  });

  afterEach(() => {
    obs.complete();
    obs = new Subject<DeviceSessionState>();
    jest.clearAllMocks();
  });

  it("should open a device", async () => {
    expect(transport).toBeInstanceOf(DeviceManagementKitTransport);
  });

  it("should be able to exchange APDU", async () => {
    jest.spyOn(deviceManagementKit, "sendApdu").mockResolvedValue({
      data: Buffer.from([]),
      statusCode: Buffer.from([0x90, 0x00]),
    });

    const expected = Buffer.from([0x90, 0x00]);
    const apdu = Buffer.from([0x00, 0x01, 0x02, 0x03]);

    const response = await transport.exchange(apdu);

    expect(response).toEqual(expected);
  });

  it("should listen to available disconnected devices", async () => {
    const mockAvailableDevices = new Observable<DiscoveredDevice[]>(subscriber => {
      subscriber.next([testDevice1]);
      subscriber.next([testDevice1, testDevice2]);
      subscriber.next([testDevice2]);
      subscriber.complete();
    });

    jest
      .spyOn(deviceManagementKit, "listenToAvailableDevices")
      .mockReturnValue(mockAvailableDevices);
    jest
      .spyOn(deviceManagementKit, "listenToConnectedDevice")
      .mockReturnValue(new Observable<ConnectedDevice>());
    jest.spyOn(deviceManagementKit, "getDeviceSessionState").mockReturnValue(new Observable());

    DeviceManagementKitTransport.listen(mockObserver);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockObserver.next).toHaveBeenCalledTimes(3);
    expect(mockObserver.next.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        type: "add",
        device: testDevice1,
      }),
    );
    expect(mockObserver.next.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        type: "add",
        device: testDevice2,
      }),
    );
    expect(mockObserver.next.mock.calls[2][0]).toEqual(
      expect.objectContaining({
        type: "remove",
        device: testDevice1,
      }),
    );
  });

  it("should not remove device if connected", async () => {
    const mockAvailableDevices = new Observable<DiscoveredDevice[]>(subscriber => {
      subscriber.next([testDevice1, testDevice2]);
      subscriber.next([]);
      subscriber.complete();
    });
    const mockConnectedDevices = new Observable<ConnectedDevice>(subscriber => {
      subscriber.next(connectedDevice1);
      subscriber.complete();
    });

    jest
      .spyOn(deviceManagementKit, "listenToAvailableDevices")
      .mockReturnValue(mockAvailableDevices);
    jest
      .spyOn(deviceManagementKit, "listenToConnectedDevice")
      .mockReturnValue(mockConnectedDevices);
    jest.spyOn(deviceManagementKit, "getDeviceSessionState").mockReturnValue(new Observable());

    DeviceManagementKitTransport.listen(mockObserver);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockObserver.next).toHaveBeenCalledTimes(3);
    expect(mockObserver.next.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        type: "add",
        device: testDevice1,
      }),
    );
    expect(mockObserver.next.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        type: "add",
        device: testDevice2,
      }),
    );
    expect(mockObserver.next.mock.calls[2][0]).toEqual(
      expect.objectContaining({
        type: "remove",
        device: testDevice2,
      }),
    );
  });

  it("should not remove connected device if disconnected but available", async () => {
    const mockAvailableDevices = new Observable<DiscoveredDevice[]>(subscriber => {
      subscriber.next([testDevice1, testDevice2]);
      subscriber.next([testDevice1]);
      subscriber.complete();
    });
    const mockConnectedDevices = new Observable<ConnectedDevice>(subscriber => {
      subscriber.next(connectedDevice1);
      subscriber.complete();
    });
    const mockSessionState = new Observable<DeviceSessionState>(subscriber => {
      subscriber.next({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState);
      subscriber.next({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState);
      subscriber.next({ deviceStatus: DeviceStatus.NOT_CONNECTED } as DeviceSessionState);
      subscriber.complete();
    });

    jest
      .spyOn(deviceManagementKit, "listenToAvailableDevices")
      .mockReturnValue(mockAvailableDevices);
    jest
      .spyOn(deviceManagementKit, "listenToConnectedDevice")
      .mockReturnValue(mockConnectedDevices);
    jest.spyOn(deviceManagementKit, "getDeviceSessionState").mockReturnValue(mockSessionState);

    DeviceManagementKitTransport.listen(mockObserver);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockObserver.next).toHaveBeenCalledTimes(3);
    expect(mockObserver.next.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        type: "add",
        device: testDevice1,
      }),
    );
    expect(mockObserver.next.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        type: "add",
        device: testDevice2,
      }),
    );
    expect(mockObserver.next.mock.calls[2][0]).toEqual(
      expect.objectContaining({
        type: "remove",
        device: testDevice2,
      }),
    );
  });

  it("should remove connected device if disconnected and not available", async () => {
    const mockAvailableDevices = new Observable<DiscoveredDevice[]>(subscriber => {
      subscriber.next([testDevice1, testDevice2]);
      subscriber.next([]);
      subscriber.complete();
    });
    const mockConnectedDevices = new Observable<ConnectedDevice>(subscriber => {
      subscriber.next(connectedDevice1);
      subscriber.complete();
    });
    const mockSessionState = new Observable<DeviceSessionState>(subscriber => {
      subscriber.next({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState);
      subscriber.next({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState);
      subscriber.next({ deviceStatus: DeviceStatus.NOT_CONNECTED } as DeviceSessionState);
      subscriber.complete();
    });

    jest
      .spyOn(deviceManagementKit, "listenToAvailableDevices")
      .mockReturnValue(mockAvailableDevices);
    jest
      .spyOn(deviceManagementKit, "listenToConnectedDevice")
      .mockReturnValue(mockConnectedDevices);
    jest.spyOn(deviceManagementKit, "getDeviceSessionState").mockReturnValue(mockSessionState);

    DeviceManagementKitTransport.listen(mockObserver);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockObserver.next).toHaveBeenCalledTimes(4);
    expect(mockObserver.next.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        type: "add",
        device: testDevice1,
      }),
    );
    expect(mockObserver.next.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        type: "add",
        device: testDevice2,
      }),
    );
    expect(mockObserver.next.mock.calls[2][0]).toEqual(
      expect.objectContaining({
        type: "remove",
        device: testDevice1,
      }),
    );
    expect(mockObserver.next.mock.calls[3][0]).toEqual(
      expect.objectContaining({
        type: "remove",
        device: testDevice2,
      }),
    );
  });

  it("should emit the discovered device's own id as descriptor, not an empty string", async () => {
    const mockAvailableDevices = new Observable<DiscoveredDevice[]>(subscriber => {
      subscriber.next([testDevice1]);
      subscriber.next([testDevice1, testDevice2]);
      subscriber.next([testDevice2]);
      subscriber.complete();
    });

    jest
      .spyOn(deviceManagementKit, "listenToAvailableDevices")
      .mockReturnValue(mockAvailableDevices);
    jest
      .spyOn(deviceManagementKit, "listenToConnectedDevice")
      .mockReturnValue(new Observable<ConnectedDevice>());
    jest.spyOn(deviceManagementKit, "getDeviceSessionState").mockReturnValue(new Observable());

    DeviceManagementKitTransport.listen(mockObserver);
    await new Promise(resolve => setTimeout(resolve, 0));

    // DONJON-1409: each device must carry a distinct descriptor, not the previous
    // hardcoded "" (which made every device indistinguishable here).
    expect(mockObserver.next.mock.calls[0][0]).toEqual(
      expect.objectContaining({ type: "add", descriptor: testDevice1.id }),
    );
    expect(mockObserver.next.mock.calls[1][0]).toEqual(
      expect.objectContaining({ type: "add", descriptor: testDevice2.id }),
    );
    expect(mockObserver.next.mock.calls[2][0]).toEqual(
      expect.objectContaining({ type: "remove", descriptor: testDevice1.id }),
    );
    expect(mockObserver.next.mock.calls[0][0].descriptor).not.toBe(
      mockObserver.next.mock.calls[1][0].descriptor,
    );
  });
});

describe("DeviceManagementKitTransport.open", () => {
  const dmk = getDeviceManagementKit();

  const makeDevice = (id: string): DiscoveredDevice =>
    ({
      id,
      deviceModel: { id: "flex", model: DeviceModelId.FLEX, name: "Flex" },
      name: id,
      transport: "WEB-BLE-RN-STYLE",
    }) as DiscoveredDevice;
  const usbDevice = makeDevice("usb-device");
  const bleDevice = makeDevice("ble-device");

  let connectedDevices: ConnectedDevice[];
  let connect: jest.SpyInstance;

  beforeEach(() => {
    activeDeviceSessionSubject.next(null);
    connectedDevices = [];
    jest.spyOn(dmk, "listenToAvailableDevices").mockReturnValue(of([usbDevice, bleDevice]));
    jest.spyOn(dmk, "listConnectedDevices").mockImplementation(() => connectedDevices);
    jest
      .spyOn(dmk, "getDeviceSessionState")
      .mockReturnValue(of({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState));
    connect = jest
      .spyOn(dmk, "connect")
      .mockImplementation(async ({ device }) => `session-${device.id}`);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    activeDeviceSessionSubject.next(null);
  });

  it("GIVEN two concurrent opens, WHEN they run, THEN the device is connected only once", async () => {
    const [first, second] = await Promise.all([
      DeviceManagementKitTransport.open(bleDevice.id),
      DeviceManagementKitTransport.open(bleDevice.id),
    ]);

    expect(connect).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it("GIVEN concurrent opens of different devices, WHEN they run, THEN each device gets its own session", async () => {
    const [usbTransport, bleTransport] = await Promise.all([
      DeviceManagementKitTransport.open(usbDevice.id),
      DeviceManagementKitTransport.open(bleDevice.id),
    ]);

    expect(usbTransport.sessionId).toBe("session-usb-device");
    expect(bleTransport.sessionId).toBe("session-ble-device");
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it("GIVEN a device id, WHEN opening, THEN it connects that device rather than the first one", async () => {
    const transport = await DeviceManagementKitTransport.open(bleDevice.id);

    expect(connect).toHaveBeenCalledWith(expect.objectContaining({ device: bleDevice }));
    expect(transport.deviceId).toBe(bleDevice.id);
    expect(transport.sessionId).toBe("session-ble-device");
  });

  it("GIVEN no device id or an unavailable one, WHEN opening, THEN it connects the first available device", async () => {
    await DeviceManagementKitTransport.open();
    activeDeviceSessionSubject.next(null);
    await DeviceManagementKitTransport.open("unknown-device");

    expect(connect).toHaveBeenNthCalledWith(1, expect.objectContaining({ device: usbDevice }));
    expect(connect).toHaveBeenNthCalledWith(2, expect.objectContaining({ device: usbDevice }));
  });

  it("GIVEN the target device is already connected in the DMK, WHEN opening, THEN it reuses that session", async () => {
    connectedDevices = [{ id: bleDevice.id, sessionId: "existing-session" } as ConnectedDevice];

    const transport = await DeviceManagementKitTransport.open(bleDevice.id);

    expect(connect).not.toHaveBeenCalled();
    expect(transport.sessionId).toBe("existing-session");
  });

  it("GIVEN an active session on another device, WHEN opening a device, THEN it does not reuse it", async () => {
    const usbTransport = await DeviceManagementKitTransport.open(usbDevice.id);

    const bleTransport = await DeviceManagementKitTransport.open(bleDevice.id);

    expect(bleTransport).not.toBe(usbTransport);
    expect(bleTransport.deviceId).toBe(bleDevice.id);
  });

  it("GIVEN an active session on the target device, WHEN opening it again, THEN it reuses the transport", async () => {
    const first = await DeviceManagementKitTransport.open(bleDevice.id);

    const second = await DeviceManagementKitTransport.open(bleDevice.id);

    expect(second).toBe(first);
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it("GIVEN a failed open, WHEN opening again, THEN it retries instead of sharing the failure", async () => {
    connect.mockRejectedValueOnce(new Error("connect failed"));

    await expect(DeviceManagementKitTransport.open(bleDevice.id)).rejects.toThrow("connect failed");
    const transport = await DeviceManagementKitTransport.open(bleDevice.id);

    expect(transport.sessionId).toBe("session-ble-device");
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it("GIVEN a lost session, WHEN exchanging, THEN it reconnects the original device only", async () => {
    const transport = await DeviceManagementKitTransport.open(bleDevice.id);
    connect.mockClear();
    jest.spyOn(dmk, "sendApdu").mockResolvedValue({
      data: new Uint8Array([]),
      statusCode: new Uint8Array([0x90, 0x00]),
    });

    await transport.exchange(Buffer.from([0xe0, 0x01, 0x00, 0x00]));

    expect(connect).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledWith(expect.objectContaining({ device: bleDevice }));
    expect(transport.sessionId).toBe("session-ble-device");
  });
});
