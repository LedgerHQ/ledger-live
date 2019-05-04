// @flow
import {
  createTransportReplayer,
  RecordStore
} from "@ledgerhq/hw-transport-mocker";
import getDeviceInfo from "../../hw/getDeviceInfo";

test("1.5.5", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
      => e001000000
      <= 3110000405312e352e35042300000004312e37002013fe17e06cf2f710d33328aa46d1053f8fadd48dcaeca2c5512dd79e2158d5779000
    `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.5.5",
    isBootloader: false,
    isOSU: false,
    managerAllowed: false,
    mcuVersion: "1.7",
    pinValidated: false,
    providerId: 1,
    majMin: "1.5",
    targetId: 823132164
  });
});

test("1.5.5 manager allowed", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
        => e001000000
        <= 3110000405312e352e35042b00000004312e37002013fe17e06cf2f710d33328aa46d1053f8fadd48dcaeca2c5512dd79e2158d5779000
      `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.5.5",
    isBootloader: false,
    isOSU: false,
    managerAllowed: true,
    mcuVersion: "1.7",
    pinValidated: false,
    providerId: 1,
    majMin: "1.5",
    targetId: 823132164
  });
});

test("1.4.2", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
        => e001000000
        <= 3110000305312e342e3204a600000004312e36002034c8e1ed994a446ef70c9b256d8a6e01eb949aba4b18b9f9a39b7f38782531039000
      `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.4.2",
    isBootloader: false,
    isOSU: false,
    managerAllowed: false,
    mcuVersion: "1.6",
    pinValidated: true,
    providerId: 1,
    majMin: "1.4",
    targetId: 823132163
  });
});

test("1.4.2 manager allowed", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => e001000000
    <= 3110000305312e342e3204ae00000004312e36002034c8e1ed994a446ef70c9b256d8a6e01eb949aba4b18b9f9a39b7f38782531039000
    `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.4.2",
    isBootloader: false,
    isOSU: false,
    managerAllowed: true,
    mcuVersion: "1.6",
    pinValidated: true,
    providerId: 1,
    majMin: "1.4",
    targetId: 823132163
  });
});

test("1.6 bootloader", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => e001000000
    <= 0100000103302e36080030009000
    `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    isBootloader: true,
    isOSU: false,
    majMin: "0.6",
    version: "0.6",
    mcuVersion: ""
  });
});

test("1.7 bootloader", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => e001000000
    <= 0100000103302e37080030009000
    `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    isBootloader: true,
    isOSU: false,
    majMin: "0.7",
    version: "0.7",
    mcuVersion: ""
  });
});

test("0.9 bootloader", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => e001000000
    <= 0100000103302e39080030009000
    `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    isBootloader: true,
    isOSU: false,
    majMin: "0.9",
    version: "0.9",
    mcuVersion: ""
  });
});

test("0.0 bootloader", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => e001000000
    <= 010000019000
    `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    isBootloader: true,
    isOSU: false,
    majMin: "0.0",
    version: "0.0.0",
    mcuVersion: ""
  });
});

test("OSU 1.4.2", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => e001000000
    <= 3110000309312e342e322d6f7375042000000004312e37002000000000000000000000000000000000000000000000000000000000000000009000
    `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.4.2",
    isOSU: true,
    isBootloader: false,
    majMin: "1.4",
    mcuVersion: "1.7"
  });
});

test("0SU 1.5.2", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => e001000000
    <= 3110000409312e352e322d6f7375042400000004312e35002000000000000000000000000000000000000000000000000000000000000000009000
    `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.5.2",
    isOSU: true,
    isBootloader: false,
    majMin: "1.5",
    mcuVersion: "1.5"
  });
});

test("OSU 1.5.5", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
    => e001000000
    <= 3110000409312e352e352d6f7375042400000004312e35002000000000000000000000000000000000000000000000000000000000000000009000
    `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    isOSU: true,
    version: "1.5.5"
  });
});

test("1.6.0-dev", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
      => e001000000
      <= 3110000409312e362e302d646576042300000004312e36002000000000000000000000000000000000000000000000000000000000000000009000
      `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.6.0-dev",
    majMin: "1.6",
    mcuVersion: "1.6",
    isOSU: false,
    isBootloader: false
  });
});

test("1.6.0-dev-osu", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
        => e001000000
        <= 311000040d312e362e302d6465762d6f7375042300000004312e36002000000000000000000000000000000000000000000000000000000000000000009000
        `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.6.0-dev",
    majMin: "1.6",
    mcuVersion: "1.6",
    isOSU: true,
    isBootloader: false
  });
});

test("1.6.0-rc1 osu", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
          => e001000000
          <= 311000040d312e362e302d7263312d6f7375042000000004312e37002000000000000000000000000000000000000000000000000000000000000000009000
          `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.6.0-rc1",
    majMin: "1.6",
    mcuVersion: "1.7",
    isOSU: true,
    isBootloader: false
  });
});

test("nano x 1.1.6", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
            => e001000000
            <= 3300000405312e312e3604a600000003322e339000
            `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.1.6",
    mcuVersion: "2.3",
    majMin: "1.1",
    isBootloader: false,
    isOSU: false,
    managerAllowed: false,
    pinValidated: true,
    providerId: 1,
    targetId: 855638020
  });
});

test("nanoS 1.4.2 BL", async () => {
  const Transport = createTransportReplayer(
    RecordStore.fromString(`
        => e001000000
        <= 0100000103302e37080030009000
        `)
  );
  const t = await Transport.create();
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    mcuVersion: "",
    version: "0.7",
    majMin: "0.7",
    isBootloader: true,
    isOSU: false,
    managerAllowed: false,
    pinValidated: false,
    providerId: 1,
    targetId: 16777217
  });
});
