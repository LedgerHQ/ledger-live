import { DeviceModelId } from "@ledgerhq/types-devices";
import { aggregateData, getUniqueModelIdList } from "../modelIdList";

const nanoS = {
  id: "nanoS1",
  name: "nanoS 0XD",
  modelId: DeviceModelId.nanoS,
};

const nanoS2 = {
  id: "nanoS2",
  name: "nanoS 0XdD",
  modelId: DeviceModelId.nanoS,
};

const nanoX = {
  id: "nanoX1",
  name: "nanoX 0XdD",
  modelId: DeviceModelId.nanoX,
};

const nanoX2 = {
  id: "nanoX2",
  name: "nanoX2 0XdD",
  modelId: DeviceModelId.nanoX,
};

const stax = {
  id: "stax1",
  name: "stax1 0x",
  modelId: DeviceModelId.stax,
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
