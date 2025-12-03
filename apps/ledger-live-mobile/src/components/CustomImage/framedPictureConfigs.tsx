import { ComponentProps } from "react";
import { Image, ImageProps } from "react-native";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { DeviceModelId } from "@ledgerhq/types-devices";
import STAX_DEVICE from "./assets/stax_device.png";
import FLEX_DEVICE from "./assets/flex_device.png";
import APEX_DEVICE from "./assets/apex_device.png";

/**
 * This is used to display a picture representing Ledger Stax and on top of it
 * a picture that is "framed" (as if it's displayed on the Ledger Stax screen).
 * The values must be taken from measurements on the Ledger Stax picture being
 * used.
 * Reminder of what Ledger Stax looks like to understand the purpose of this:
 * (I tried my best with this ASCII art)
 *  _____________
 * |____________ \ <- top edge
 * |            \ \
 * |            | |
 * |   screen   | |
 * |    of the  | |
 * | Ledger Stax| |
 * |            | |
 * |            | |
 * |____________/ /
 * |_____________/ <- bottom edge
 *
 *               ^
 *  right edge  _|
 */
export type FramedPictureConfig = {
  /**
   * Height of the Ledger Stax picture
   * */
  frameHeight: number;
  /**
   * Width of the Ledger Stax picture
   * */
  frameWidth: number;
  /**
   * Height of the "screen" zone on the Ledger Stax picture
   * */
  innerHeight: number;
  /**
   * `innerHeight` * aspect ratio of custom lockscreen pictures (400px/670px)
   * */
  innerWidth: number;
  /**
   * Distance between
   *  left border of the right edge of Ledger Stax in the picture
   *  and
   *  right border of the Ledger Stax picture
   * */
  innerRight: number;
  /**
   * Distance between
   *  top border of the Ledger Stax picture
   *  and
   *  bottom border of the top edge of Ledger Stax in the picture
   */
  innerTop: number;
  /**
   * Border radius of the inner part of the screen of Ledger Stax in the picture
   * (the screen border is curved on the top right and bottom right corner)
   */
  borderRightRadius: number;
  borderLeftRadius?: number;
  /**
   * Source of the background picture representing a Ledger Stax
   * */
  backgroundSource?: ComponentProps<typeof Image>["source"];
  resizeMode: ImageProps["resizeMode"];
  /**
   * Optional color to fill the space between the left edge of the Ledger Stax picture
   * and the left edge of the "framed" picture.
   */
  leftPaddingColor?: string;
  scaleCoefficient?: number;
};

/*  The dimensions of the Stax device image */
const STAX_FRAME_HEIGHT = 425;
const STAX_FRAME_WIDTH = 270;
export const staxFrameConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  frameHeight: STAX_FRAME_HEIGHT,
  frameWidth: STAX_FRAME_WIDTH,
  innerHeight: 402,
  innerWidth: 245,
  innerRight: 15,
  innerTop: 12,
  borderRightRadius: 18,
  resizeMode: "cover",
};

/*  The dimensions of the Flex device image */
const EUROPA_FRAME_WIDTH = 354;
const EUROPA_FRAME_HEIGHT = 392;
export const europaFrameConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  frameWidth: EUROPA_FRAME_WIDTH,
  frameHeight: EUROPA_FRAME_HEIGHT,
  innerWidth: 224,
  innerHeight: 282,
  innerRight: 66,
  innerTop: 29,
  borderRightRadius: 4,
  borderLeftRadius: 4,
  resizeMode: "cover",
};

/*  The dimensions of the Apex device image */
const APEX_FRAME_WIDTH = 270;
const APEX_FRAME_HEIGHT = 397;
export const apexFrameConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  frameWidth: APEX_FRAME_WIDTH,
  frameHeight: APEX_FRAME_HEIGHT,
  innerWidth: 210,
  innerHeight: 281,
  innerRight: 32,
  innerTop: 28,
  borderRightRadius: 4,
  borderLeftRadius: 4,
  resizeMode: "cover",
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
