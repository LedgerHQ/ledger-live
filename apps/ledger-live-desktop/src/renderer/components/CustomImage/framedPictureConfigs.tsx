import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { DeviceModelId } from "@ledgerhq/types-devices";
import STAX_DEVICE from "./assets/stax_device.png";
import FLEX_DEVICE from "./assets/flex_device.png";
import APEX_DEVICE from "./assets/apex_device.png";

export type FramedPictureConfig = {
  frameHeight: number;
  frameWidth: number;
  innerWidth: number;
  innerHeight: number;
  innerRight: number;
  innerLeft: number;
  innerTop: number;
  innerBottomHeight: number;
  borderRightRadius: number;
  borderLeftRadius?: number;
  /** source of the background image */
  backgroundSource?: string;
};

/* The dimensions of the assets */
const STAX_FRAME_HEIGHT = 425;
const STAX_FRAME_WIDTH = 270;
export const staxFrameConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  frameHeight: STAX_FRAME_HEIGHT,
  frameWidth: STAX_FRAME_WIDTH,
  innerHeight: 402,
  innerWidth: 245,
  innerRight: 8,
  innerTop: 12,
  innerLeft: 10,
  innerBottomHeight: 11,
  borderLeftRadius: 0,
  borderRightRadius: 18,
};

/* The dimensions of the assets */
const EUROPA_FRAME_WIDTH = 354;
const EUROPA_FRAME_HEIGHT = 392;
export const europaFrameConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  frameWidth: EUROPA_FRAME_WIDTH,
  frameHeight: EUROPA_FRAME_HEIGHT,
  innerWidth: 224,
  innerHeight: 282,
  innerRight: 0,
  innerTop: 29,
  innerLeft: 64,
  innerBottomHeight: 81,
  borderLeftRadius: 4,
  borderRightRadius: 4,
};

/* The dimensions of the assets */
const APEX_FRAME_WIDTH = 270;
const APEX_FRAME_HEIGHT = 397;
export const apexFrameConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  frameWidth: APEX_FRAME_WIDTH,
  frameHeight: APEX_FRAME_HEIGHT,
  innerWidth: 210,
  innerHeight: 281,
  innerRight: 0,
  innerTop: 28,
  innerLeft: 29,
  innerBottomHeight: 88,
  borderLeftRadius: 4,
  borderRightRadius: 4,
};

const configs: Record<CLSSupportedDeviceModelId, FramedPictureConfig> = {
  [DeviceModelId.stax]: {
    ...staxFrameConfig,
    backgroundSource: STAX_DEVICE,
  },
  [DeviceModelId.europa]: {
    ...europaFrameConfig,
    backgroundSource: FLEX_DEVICE,
  },
  [DeviceModelId.apex]: {
    ...apexFrameConfig,
    backgroundSource: APEX_DEVICE,
  },
};

export function getFramedPictureConfig(
  deviceModelId: CLSSupportedDeviceModelId,
): FramedPictureConfig {
  return configs[deviceModelId];
}
