import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { Flex, Nano, NanoGen5, Stax } from "@ledgerhq/lumen-ui-rnative/symbols";

const DEVICE_SYMBOLS: Partial<Record<DeviceModelId, typeof Nano>> = {
  [DeviceModelId.FLEX]: Flex,
  [DeviceModelId.APEX]: NanoGen5,
  [DeviceModelId.STAX]: Stax,
};

export const getDeviceSymbol = (modelId: DeviceModelId) => DEVICE_SYMBOLS[modelId] ?? Nano;
