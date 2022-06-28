import { DeviceModelId } from "@ledgerhq/devices";
import type { DeviceInfo } from "@ledgerhq/types-live";
const deviceInfos: Record<
  string,
  {
    modelId: DeviceModelId;
    deviceInfo: DeviceInfo;
  }
> = {
  NanoS120: {
    modelId: DeviceModelId.nanoS,
    deviceInfo: {
      version: "1.2",
      mcuVersion: "1.0",
      majMin: "1.2",
      providerName: null,
      targetId: 823132162,
      isOSU: false,
      isBootloader: false,
      managerAllowed: false,
      pinValidated: false,
    },
  },
  NanoS142: {
    modelId: DeviceModelId.nanoS,
    deviceInfo: {
      version: "1.4.2",
      isBootloader: false,
      isOSU: false,
      managerAllowed: false,
      mcuVersion: "1.6",
      pinValidated: true,
      providerName: null,
      majMin: "1.4",
      targetId: 823132163,
    },
  },
  NanoS155: {
    modelId: DeviceModelId.nanoS,
    deviceInfo: {
      version: "1.5.5",
      isBootloader: false,
      isOSU: false,
      managerAllowed: false,
      mcuVersion: "1.7",
      pinValidated: false,
      providerName: null,
      majMin: "1.5",
      targetId: 823132164,
    },
  },
  NanoX1242rc5: {
    modelId: DeviceModelId.nanoX,
    deviceInfo: {
      version: "1.2.4-2-rc5",
      mcuVersion: "2.9-rc1",
      majMin: "1.2",
      providerName: null,
      targetId: 855638020,
      isOSU: false,
      isBootloader: false,
      managerAllowed: true,
      pinValidated: true,
    },
  },
  Blue211: {
    modelId: DeviceModelId.blue,
    deviceInfo: {
      version: "2.1.1",
      mcuVersion: "3.4-hw15",
      majMin: "2.1",
      providerName: null,
      targetId: 822149124,
      isOSU: false,
      isBootloader: false,
      managerAllowed: false,
      pinValidated: true,
    },
  },
};
export function lenseDevice(id: keyof typeof deviceInfos): {
  deviceInfo: DeviceInfo;
  modelId: DeviceModelId;
} {
  return deviceInfos[id];
}
export function lenseDevices(ids: Array<keyof typeof deviceInfos>): Array<{
  deviceInfo: DeviceInfo;
  modelId: DeviceModelId;
}> {
  return ids.map((id) => deviceInfos[id]);
}
