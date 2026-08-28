import { BehaviorSubject, of, Subject, Observable } from "rxjs";
import {
  ConnectedDevice,
  DeviceModelId,
  DeviceStatus,
  DiscoveredDevice,
  DeviceSessionState,
  DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import { CantOpenDevice } from "@ledgerhq/hw-transport/errors";
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

  // Mirrors the real WebHID transport, whose device list starts as an empty array.
  describe("open with no device available yet", () => {
    let availableDevices: BehaviorSubject<DiscoveredDevice[]>;

    beforeEach(() => {
      activeDeviceSessionSubject.next(null);
      availableDevices = new BehaviorSubject<DiscoveredDevice[]>([]);
      jest
        .spyOn(deviceManagementKit, "listenToAvailableDevices")
        .mockReturnValue(availableDevices.asObservable());
      jest
        .spyOn(deviceManagementKit, "getDeviceSessionState")
        .mockReturnValue(new Subject<DeviceSessionState>());
    });

    afterEach(() => {
      activeDeviceSessionSubject.next(null);
    });

    it("should skip the empty list and connect to the first device that shows up", async () => {
      const connect = jest.spyOn(deviceManagementKit, "connect").mockResolvedValue("session-456");

      const opening = DeviceManagementKitTransport.open();
      availableDevices.next([testDevice1]);

      await expect(opening).resolves.toBeInstanceOf(DeviceManagementKitTransport);
      expect(connect).toHaveBeenCalledWith(expect.objectContaining({ device: testDevice1 }));
    });

    it("should throw CantOpenDevice instead of connecting to an undefined device", async () => {
      const connect = jest.spyOn(deviceManagementKit, "connect");

      await expect(DeviceManagementKitTransport.open(10)).rejects.toBeInstanceOf(CantOpenDevice);
      expect(connect).not.toHaveBeenCalled();
    });
  });
});
