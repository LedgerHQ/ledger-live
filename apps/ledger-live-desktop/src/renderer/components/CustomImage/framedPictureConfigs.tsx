import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import STAX_DEVICE from "./assets/stax_device.png";
import FLEX_DEVICE from "./assets/flex_device.png";
import APEX_DEVICE from "./assets/apex_device.png";
import { FramedPictureConfig } from "./FramedPicture";

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
  borderRightRadius: 18,
};

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
  innerBottomHeight: 82,
  borderRightRadius: 4,
  borderLeftRadius: 4,
};

const configs = {
  stax: {
    ...staxFrameConfig,
    backgroundSource: STAX_DEVICE,
  },
  europa: {
    ...europaFrameConfig,
    backgroundSource: FLEX_DEVICE,
  },
  apex: {
    ...europaFrameConfig,
    backgroundSource: APEX_DEVICE,
  },
};

export function getFramedPictureConfig(
  deviceModelId: CLSSupportedDeviceModelId,
): FramedPictureConfig {
  return configs[deviceModelId];
}
