import { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeviceInfo } from "@ledgerhq/types-live";
import { aggregateData, getUniqueModelIdList } from "../modelIdList";

const DEVICE_INFO: DeviceInfo = {
  targetId: 0,
  mcuVersion: "2.30",
  version: "2.0.2",
  majMin: "2.0",
  isBootloader: false,
  isOSU: false,
  providerName: null,
  managerAllowed: false,
  pinValidated: true,
};

const nanoS = {
  modelId: DeviceModelId.nanoS,
  deviceInfo: { ...DEVICE_INFO, targetId: 1000 },
  apps: [],
};

const nanoS2 = {
  modelId: DeviceModelId.nanoS,
  deviceInfo: { ...DEVICE_INFO, targetId: 1001 },
  apps: [],
};

const nanoX = {
  modelId: DeviceModelId.nanoX,
  deviceInfo: { ...DEVICE_INFO, targetId: 1002 },
  apps: [],
};

const nanoX2 = {
  modelId: DeviceModelId.nanoX,
  deviceInfo: { ...DEVICE_INFO, targetId: 1003 },
  apps: [],
};

const stax = {
  modelId: DeviceModelId.stax,
  deviceInfo: { ...DEVICE_INFO, targetId: 1004 },
  apps: [],
};

describe("modelQtyIdList", () => {
  it("should excecute properly with one device model", () => {
    const data = aggregateData([nanoS, nanoX, stax]);

    expect(data).toEqual({
      [DeviceModelId.nanoS]: 1,
      [DeviceModelId.nanoX]: 1,
      [DeviceModelId.stax]: 1,
    });
  });

  it("should excecute properly with multiple device model", () => {
    const data = aggregateData([nanoX2, nanoS, nanoX, stax, nanoS2]);

    expect(data).toEqual({
      [DeviceModelId.nanoS]: 2,
      [DeviceModelId.nanoX]: 2,
      [DeviceModelId.stax]: 1,
    });
  });
});

describe("modelIdList", () => {
  it("should excecute properly with one device model", () => {
    const data = getUniqueModelIdList([nanoS, nanoX, nanoS2]);

    expect(data).toEqual([DeviceModelId.nanoS, DeviceModelId.nanoX]);
  });

  it("should excecute properly with multiple device model", () => {
    const data = getUniqueModelIdList([nanoS, nanoX, stax, nanoS2, nanoX2]);

    expect(data).toEqual([DeviceModelId.nanoS, DeviceModelId.nanoX, DeviceModelId.stax]);
  });
});
