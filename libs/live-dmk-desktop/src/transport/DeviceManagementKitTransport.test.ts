import { of, Subject } from "rxjs";
import {
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

    const response = await transport.exchange(apdu);

    expect(response).toEqual(expected);
  });
});
