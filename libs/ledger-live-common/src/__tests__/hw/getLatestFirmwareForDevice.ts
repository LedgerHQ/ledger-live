import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import getDeviceInfo from "../../hw/getDeviceInfo";
import manager from "../../manager";
import { fetchNextFirmware } from "../../hw/installFinalFirmware";
jest.setTimeout(20000);

/*
// FIXME not yet there?
test("1.2.0", async () => {
  const deviceInfo = {
    version: "1.2",
    mcuVersion: "1.0",
    majMin: "1.2",
    providerName: null,
    targetId: 823132162,
    isOSU: false,
    isBootloader: false,
    managerAllowed: false,
    pinValidated: false
  };
  const res = await manager.getLatestFirmwareForDevice(deviceInfo);
  expect(res).toMatchObject({ final: {}, osu: {} });
});
*/
test("1.3.1", async () => {
  const deviceInfo = {
    version: "1.3.1",
    mcuVersion: "1.1",
    majMin: "1.3",
    providerName: null,
    targetId: 823132162,
    isOSU: false,
    isBootloader: false,
    managerAllowed: true,
    pinValidated: true,
  };
  const res = await manager.getLatestFirmwareForDevice(deviceInfo);
  expect(res).toMatchObject({
    final: {},
    osu: {},
  });
});
test("1.4.2", async () => {
  const deviceInfo = {
    version: "1.4.2",
    isBootloader: false,
    isOSU: false,
    managerAllowed: false,
    mcuVersion: "1.6",
    pinValidated: true,
    providerName: null,
    majMin: "1.4",
    targetId: 823132163,
  };
  const res = await manager.getLatestFirmwareForDevice(deviceInfo);
  expect(res).toMatchObject({
    final: {},
    osu: {},
  });
});

/*
test("1.5.5", async () => {
  const deviceInfo = {
    version: "1.5.5",
    isBootloader: false,
    isOSU: false,
    managerAllowed: false,
    mcuVersion: "1.7",
    pinValidated: false,
    providerName: null,
    majMin: "1.5",
    targetId: 823132164
  };
  const res = await manager.getLatestFirmwareForDevice(deviceInfo);
  expect(res).toMatchObject({ final: {}, osu: {} });
});
*/
test("nano x 1.1.6", async () => {
  const deviceInfo = {
    version: "1.1.6",
    mcuVersion: "2.3",
    majMin: "1.1",
    isBootloader: false,
    isOSU: false,
    managerAllowed: false,
    pinValidated: true,
    providerName: null,
    targetId: 855638020,
  };
  const res = await manager.getLatestFirmwareForDevice(deviceInfo);
  expect(res).toBe(null);
});
// TODO waiting it to be stable

/*
test("nano x 1.2.4-1", async () => {
  const deviceInfo = {
    version: "1.2.4-1",
    mcuVersion: "2.8",
    majMin: "1.2",
    providerName: null,
    targetId: 855638020,
    isOSU: false,
    isBootloader: false,
    managerAllowed: true,
    pinValidated: true,
  };
  const res = await manager.getLatestFirmwareForDevice(deviceInfo);
  expect(res).toBe(null);
});
*/
test("nanoS das", async () => {
  const deviceInfo = {
    isBootloader: false,
    isOSU: false,
    majMin: "1.4",
    managerAllowed: false,
    mcuVersion: "1.5",
    pinValidated: true,
    providerName: "das",
    targetId: 823132163,
    version: "1.4.2-das",
  };
  const res = await manager.getLatestFirmwareForDevice(deviceInfo);
  expect(res).toBe(null);
});
test("OSU 1.4.2", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
    => e001000000
    <= 3110000309312e342e322d6f7375042000000004312e37002000000000000000000000000000000000000000000000000000000000000000009000
    `)
  );
  const deviceInfo = await getDeviceInfo(t);
  const next = await fetchNextFirmware(deviceInfo).toPromise();
  expect(next).toBeDefined();
  expect(next.firmware).toBeTruthy();
});
test("OSU 1.5.5", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
    => e001000000
    <= 3110000409312e352e352d6f7375042400000004312e35002000000000000000000000000000000000000000000000000000000000000000009000
    `)
  );
  const deviceInfo = await getDeviceInfo(t);
  const next = await fetchNextFirmware(deviceInfo).toPromise();
  expect(next).toBeDefined();
  expect(next.firmware).toBeTruthy();
});
