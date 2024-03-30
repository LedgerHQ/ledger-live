import type { DeviceInfo } from "@ledgerhq/types-live";

export const aDeviceInfoBuilder = (props?: Partial<DeviceInfo>): DeviceInfo => {
  return {
    mcuVersion: "A_MCU_VERSION",
    version: "A_VERSION",
    majMin: "A_MAJ_MIN",
    targetId: "0.0",
    isBootloader: false,
    isOSU: true,
    providerName: undefined,
    managerAllowed: false,
    pinValidated: true,
    ...props,
  };
};
