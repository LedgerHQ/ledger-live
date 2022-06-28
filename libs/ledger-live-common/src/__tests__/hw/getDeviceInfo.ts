import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import getDeviceInfo from "../../hw/getDeviceInfo";

test("1.2.0", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
      => b001000000
      <= 0105424f4c4f5305312e362e3001029000
      => e001000000
      <= 3110000203312e32040600000004312e30009000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.2",
    mcuVersion: "1.0",
    majMin: "1.2",
    providerName: null,
    targetId: 823132162,
    isOSU: false,
    isBootloader: false,
    managerAllowed: false,
    pinValidated: false,
  });
});
test("1.3.1", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
      => b001000000
      <= 0105424f4c4f5305312e362e3001029000
      => e001000000
      <= 3110000205312e332e31048e00000004312e31009000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.3.1",
    mcuVersion: "1.1",
    majMin: "1.3",
    providerName: null,
    targetId: 823132162,
    isOSU: false,
    isBootloader: false,
    managerAllowed: true,
    pinValidated: true,
  });
});
test("1.3.1 BL", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
      => b001000000
      <= 0105424f4c4f5305312e362e3001029000
      => e001000000
      <= 010000019000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "0.0.0",
    isBootloader: true,
    isOSU: false,
    managerAllowed: false,
    mcuVersion: "",
    pinValidated: false,
    providerName: null,
    majMin: "0.0",
    targetId: 16777217,
  });
});
test("1.5.5", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
      => b001000000
      <= 0105424f4c4f5305312e362e3001029000
      => e001000000
      <= 3110000405312e352e35042300000004312e37002013fe17e06cf2f710d33328aa46d1053f8fadd48dcaeca2c5512dd79e2158d5779000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.5.5",
    isBootloader: false,
    isOSU: false,
    managerAllowed: false,
    mcuVersion: "1.7",
    pinValidated: false,
    providerName: null,
    majMin: "1.5",
    targetId: 823132164,
  });
});
test("1.5.5 manager allowed", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
        => b001000000
        <= 0105424f4c4f5305312e362e3001029000
        => e001000000
        <= 3110000405312e352e35042b00000004312e37002013fe17e06cf2f710d33328aa46d1053f8fadd48dcaeca2c5512dd79e2158d5779000
      `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.5.5",
    isBootloader: false,
    isOSU: false,
    managerAllowed: true,
    mcuVersion: "1.7",
    pinValidated: false,
    providerName: null,
    majMin: "1.5",
    targetId: 823132164,
  });
});
test("1.4.2", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
        => b001000000
        <= 0105424f4c4f5305312e362e3001029000
        => e001000000
        <= 3110000305312e342e3204a600000004312e36002034c8e1ed994a446ef70c9b256d8a6e01eb949aba4b18b9f9a39b7f38782531039000
      `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.4.2",
    isBootloader: false,
    isOSU: false,
    managerAllowed: false,
    mcuVersion: "1.6",
    pinValidated: true,
    providerName: null,
    majMin: "1.4",
    targetId: 823132163,
  });
});
test("1.4.2 manager allowed", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
    => e001000000
    <= 3110000305312e342e3204ae00000004312e36002034c8e1ed994a446ef70c9b256d8a6e01eb949aba4b18b9f9a39b7f38782531039000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.4.2",
    isBootloader: false,
    isOSU: false,
    managerAllowed: true,
    mcuVersion: "1.6",
    pinValidated: true,
    providerName: null,
    majMin: "1.4",
    targetId: 823132163,
  });
});
test("1.6 bootloader", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
    => e001000000
    <= 0100000103302e36080030009000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    isBootloader: true,
    isOSU: false,
    majMin: "0.6",
    version: "0.6",
    mcuVersion: "",
  });
});
test("1.7 bootloader", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
    => e001000000
    <= 0100000103302e37080030009000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    isBootloader: true,
    isOSU: false,
    majMin: "0.7",
    version: "0.7",
    mcuVersion: "",
  });
});
test("0.9 bootloader", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
    => e001000000
    <= 0100000103302e39080030009000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    isBootloader: true,
    isOSU: false,
    majMin: "0.9",
    version: "0.9",
    mcuVersion: "",
  });
});
test("0.11 bootloader", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
    => e001000000
    <= 0100000104302e3131080030009000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    isBootloader: true,
    isOSU: false,
    majMin: "0.11",
    version: "0.11",
    mcuVersion: "",
  });
});
test("0.11 BL (2)", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
    => e001000000
    <= 0100000104302e313104f4d8aa439000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "0.11",
    mcuVersion: "",
    majMin: "0.11",
    providerName: null,
    targetId: 16777217,
    isOSU: false,
    isBootloader: true,
    managerAllowed: false,
    pinValidated: true,
  });
});
test("0.0 bootloader", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
    => e001000000
    <= 010000019000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    isBootloader: true,
    isOSU: false,
    majMin: "0.0",
    version: "0.0.0",
    mcuVersion: "",
  });
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
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.4.2",
    isOSU: true,
    isBootloader: false,
    majMin: "1.4",
    mcuVersion: "1.7",
  });
});
test("0SU 1.5.2", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
    => e001000000
    <= 3110000409312e352e322d6f7375042400000004312e35002000000000000000000000000000000000000000000000000000000000000000009000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.5.2",
    isOSU: true,
    isBootloader: false,
    majMin: "1.5",
    mcuVersion: "1.5",
  });
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
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    isOSU: true,
    version: "1.5.5",
  });
});
test("1.6.0-dev", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
      => e001000000
      <= 3110000409312e362e302d646576042300000004312e36002000000000000000000000000000000000000000000000000000000000000000009000
      `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.6.0-dev",
    majMin: "1.6",
    mcuVersion: "1.6",
    isOSU: false,
    isBootloader: false,
  });
});
test("1.6.0-dev-osu", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
        => e001000000
        <= 311000040d312e362e302d6465762d6f7375042300000004312e36002000000000000000000000000000000000000000000000000000000000000000009000
        `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.6.0-dev",
    majMin: "1.6",
    mcuVersion: "1.6",
    isOSU: true,
    isBootloader: false,
  });
});
test("1.6.0-rc1 osu", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
    => e001000000
    <= 311000040d312e362e302d7263312d6f7375042000000004312e37002000000000000000000000000000000000000000000000000000000000000000009000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.6.0-rc1",
    majMin: "1.6",
    mcuVersion: "1.7",
    isOSU: true,
    isBootloader: false,
  });
});
test("nano x 1.1.6", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
    => e001000000
    <= 3300000405312e312e3604a600000003322e339000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.1.6",
    mcuVersion: "2.3",
    majMin: "1.1",
    isBootloader: false,
    isOSU: false,
    managerAllowed: false,
    pinValidated: true,
    providerName: null,
    targetId: 855638020,
  });
});
test("nano x 1.2.4-1", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
    => e001000000
    <= 3300000407312e322e342d3104ae00000003322e389000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.2.4-1",
    mcuVersion: "2.8",
    majMin: "1.2",
    providerName: null,
    targetId: 855638020,
    isOSU: false,
    isBootloader: false,
    managerAllowed: true,
    pinValidated: true,
  });
});
test("nanoS 1.4.2 BL", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
        => b001000000
        <= 0105424f4c4f5305312e362e3001029000
        => e001000000
        <= 0100000103302e37080030009000
        `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    mcuVersion: "",
    version: "0.7",
    majMin: "0.7",
    isBootloader: true,
    isOSU: false,
    managerAllowed: false,
    pinValidated: false,
    providerName: null,
    targetId: 16777217,
  });
});
test("nanoS das", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e362e3001029000
    => e001000000
    <= 3110000309312e342e322d64617304a600000004312e350020f52add41aaa8c065df5a412af1e8c57fe589b85469133cb9c7e0ccd5c81b57859000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    isBootloader: false,
    isOSU: false,
    majMin: "1.4",
    managerAllowed: false,
    mcuVersion: "1.5",
    pinValidated: true,
    providerName: "das",
    targetId: 823132163,
    version: "1.4.2-das",
  });
});

test("Nano X BL < 2", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 6e00
    => e001000000
    <= 0501000203312e3404f4d8aa43043300000404f13089749000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.4",
    mcuBlVersion: "1.4",
    seVersion: undefined,
    majMin: "1.4",
    providerName: null,
    targetId: 83951618,
    seTargetId: 855638020,
    mcuTargetId: 83951618,
    isOSU: false,
    isBootloader: true,
    managerAllowed: false,
    pinValidated: true,
  });
});

test("Nano X BL >= 2", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 6e00
    => e001000000
    <= 0501000203312e3404f4d8aa4305322e302e3004330000049000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.4",
    mcuBlVersion: "1.4",
    seVersion: "2.0.0",
    majMin: "1.4",
    providerName: null,
    targetId: 83951618,
    seTargetId: 855638020,
    mcuTargetId: 83951618,
    isOSU: false,
    isBootloader: true,
    managerAllowed: false,
    pinValidated: true,
  });
});
test("Nano X 1.2.4-6", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 01054f4c4f5300072e322e342d36009000
    => e001000000
    <= 3300000407312e322e342d3604a600000004322e31329000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.2.4-6",
    mcuVersion: "2.12",
    seVersion: "1.2.4-6",
    majMin: "1.2",
    providerName: null,
    targetId: 855638020,
    seTargetId: 855638020,
    isOSU: false,
    isBootloader: false,
    isRecoveryMode: false,
    managerAllowed: false,
    pinValidated: true,
    onboarded: true,
  });
});
test("Nano X 2.0.0", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305322e302e309000
    => e001000000
    <= 3300000405322e302e3004a600000004322e323804312e313601009000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "2.0.0",
    mcuVersion: "2.28",
    seVersion: "2.0.0",
    majMin: "2.0",
    providerName: null,
    targetId: 855638020,
    seTargetId: 855638020,
    isOSU: false,
    isBootloader: false,
    isRecoveryMode: false,
    managerAllowed: false,
    pinValidated: true,
    onboarded: true,
    bootloaderVersion: "1.16",
    hardwareVersion: 0,
  });
});
test("Nano X 2.1.0-lo2", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5309322e312e302d6c6f329000
    => e001000000
    <= 3300000409322e312e302d6c6f3204e600000004322e333004312e3136010001019000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "2.1.0-lo2",
    mcuVersion: "2.30",
    seVersion: "2.1.0-lo2",
    majMin: "2.1",
    providerName: null,
    targetId: 855638020,
    seTargetId: 855638020,
    isOSU: false,
    isBootloader: false,
    isRecoveryMode: false,
    managerAllowed: false,
    pinValidated: true,
    onboarded: true,
    bootloaderVersion: "1.16",
    hardwareVersion: 0,
    languageId: 1,
  });
});
test("Nano S 2.1.0", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305322e312e309000
    => e001000000
    <= 3110000405322e312e3004a600000004312e313204302e31319000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "2.1.0",
    mcuVersion: "1.12",
    seVersion: "2.1.0",
    majMin: "2.1",
    providerName: null,
    targetId: 823132164,
    seTargetId: 823132164,
    isOSU: false,
    isBootloader: false,
    isRecoveryMode: false,
    managerAllowed: false,
    pinValidated: true,
    onboarded: true,
    bootloaderVersion: "0.11",
  });
});
test("Nano S+ 1.0.2", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0105424f4c4f5305312e302e329000
    => e001000000
    <= 3310000405312e302e3204a600000004342e303204332e31329000
    `)
  );
  const res = await getDeviceInfo(t);
  expect(res).toMatchObject({
    version: "1.0.2",
    mcuVersion: "4.02",
    seVersion: "1.0.2",
    majMin: "1.0",
    providerName: null,
    targetId: 856686596,
    seTargetId: 856686596,
    isOSU: false,
    isBootloader: false,
    isRecoveryMode: false,
    managerAllowed: false,
    pinValidated: true,
    onboarded: true,
    bootloaderVersion: "3.12",
  });
});
