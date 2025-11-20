import { of, Subject, Observable } from "rxjs";
import {
  ConnectedDevice,
  DeviceModelId,
  DeviceStatus,
  DiscoveredDevice,
  DeviceSessionState,
  DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import { DeviceManagementKitTransport } from "./DeviceManagementKitTransport";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";

let obs: Subject<DeviceSessionState> = new Subject<DeviceSessionState>();
let transport: DeviceManagementKitTransport;
let deviceManagementKit: DeviceManagementKit;

describe("DeviceManagementKitTransport", () => {
  const mockObserver = {
    next: vi.fn(),
    error: vi.fn(),
    complete: vi.fn(),
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
    vi.spyOn(deviceManagementKit, "listenToAvailableDevices").mockImplementation(() => {
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
    vi.spyOn(deviceManagementKit, "connect").mockResolvedValue(`session-123`);
    vi.spyOn(deviceManagementKit, "getDeviceSessionState").mockImplementation(() => {
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
    vi.clearAllMocks();
  });

  it("should open a device", async () => {
    expect(transport).toBeInstanceOf(DeviceManagementKitTransport);
  });

  it("should be able to exchange APDU", async () => {
    vi.spyOn(deviceManagementKit, "sendApdu").mockResolvedValue({
      data: Buffer.from([]),
      statusCode: Buffer.from([0x90, 0x00]),
    });

    const expected = Buffer.from([0x90, 0x00]);
    const apdu = Buffer.from([0x00, 0x01, 0x02, 0x03]);

    const response = await transport.exchange(apdu, { abortTimeoutMs: 500 });

    expect(response).toEqual(expected);
    expect(deviceManagementKit.sendApdu).toHaveBeenCalledWith({
      sessionId: "session-123",
      apdu: new Uint8Array(apdu),
      abortTimeout: 500,
    });
  });

  it("should listen to available disconnected devices", async () => {
    const mockAvailableDevices = new Observable<DiscoveredDevice[]>(subscriber => {
      subscriber.next([testDevice1]);
      subscriber.next([testDevice1, testDevice2]);
      subscriber.next([testDevice2]);
      subscriber.complete();
    });

    vi.spyOn(deviceManagementKit, "listenToAvailableDevices").mockReturnValue(mockAvailableDevices);
    vi.spyOn(deviceManagementKit, "listenToConnectedDevice").mockReturnValue(
      new Observable<ConnectedDevice>(),
    );
    vi.spyOn(deviceManagementKit, "getDeviceSessionState").mockReturnValue(new Observable());

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

    vi.spyOn(deviceManagementKit, "listenToAvailableDevices").mockReturnValue(mockAvailableDevices);
    vi.spyOn(deviceManagementKit, "listenToConnectedDevice").mockReturnValue(mockConnectedDevices);
    vi.spyOn(deviceManagementKit, "getDeviceSessionState").mockReturnValue(new Observable());

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

    vi.spyOn(deviceManagementKit, "listenToAvailableDevices").mockReturnValue(mockAvailableDevices);
    vi.spyOn(deviceManagementKit, "listenToConnectedDevice").mockReturnValue(mockConnectedDevices);
    vi.spyOn(deviceManagementKit, "getDeviceSessionState").mockReturnValue(mockSessionState);

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

    vi.spyOn(deviceManagementKit, "listenToAvailableDevices").mockReturnValue(mockAvailableDevices);
    vi.spyOn(deviceManagementKit, "listenToConnectedDevice").mockReturnValue(mockConnectedDevices);
    vi.spyOn(deviceManagementKit, "getDeviceSessionState").mockReturnValue(mockSessionState);

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
});
