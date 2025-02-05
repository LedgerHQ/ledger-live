import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import staxTransferBackgroundLight from "./assets/staxTransferBackgroundLight.png";
import staxTransferBackgroundDark from "./assets/staxTransferBackgroundDark.png";
import europaTransferBackgroundLight from "./assets/europaTransferBackgroundLight.png";
import europaTransferBackgroundDark from "./assets/europaTransferBackgroundDark.png";
import { FramedPictureConfig } from "./FramedPicture";

const STAX_FRAME_HEIGHT = 960;
const STAX_FRAME_WIDTH = 960;

export const staxTransferConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  frameHeight: STAX_FRAME_HEIGHT / 4,
  frameWidth: STAX_FRAME_WIDTH / 4,
  innerHeight: 192,
  innerWidth: 122,
  innerRight: 8,
  innerTop: 22,
  innerLeft: 58,
  innerBottomHeight: 0,
  borderRightRadius: 10,
};

const EUROPA_FRAME_WIDTH = 572;
const EUROPA_FRAME_HEIGHT = 784;

export const europaTransferConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  frameWidth: EUROPA_FRAME_WIDTH / 2,
  frameHeight: EUROPA_FRAME_HEIGHT / 2,
  innerWidth: 224,
  innerHeight: 282,
  innerRight: 40,
  innerTop: 30,
  innerLeft: 29,
  innerBottomHeight: 40,
  borderRightRadius: 4,
  borderLeftRadius: 4,
};

export const europaPreviewConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  frameWidth: EUROPA_FRAME_WIDTH / 4,
  frameHeight: EUROPA_FRAME_HEIGHT / 4,
  innerWidth: 90.5,
  innerHeight: 136.5,
  innerRight: 21,
  innerTop: 27.5,
  innerLeft: 28,
  innerBottomHeight: 20,
  borderRightRadius: 5,
  borderLeftRadius: 5,
};

const configs = {
  transfer: {
    stax: {
      light: {
        ...staxTransferConfig,
        backgroundSource: staxTransferBackgroundLight,
      },
      dark: {
        ...staxTransferConfig,
        backgroundSource: staxTransferBackgroundDark,
      },
    },
    europa: {
      light: {
        ...europaTransferConfig,
        backgroundSource: europaTransferBackgroundLight,
      },
      dark: {
        ...europaTransferConfig,
        backgroundSource: europaTransferBackgroundDark,
      },
    },
  },
  preview: {
    stax: {
      light: {
        ...staxTransferConfig,
        backgroundSource: staxTransferBackgroundLight,
      },
      dark: {
        ...staxTransferConfig,
        backgroundSource: staxTransferBackgroundDark,
      },
    },
    europa: {
      light: {
        ...europaPreviewConfig,
        backgroundSource: europaTransferBackgroundLight,
      },
      dark: {
        ...europaPreviewConfig,
        backgroundSource: europaTransferBackgroundDark,
      },
    },
  },
};

export function getFramedPictureConfig(
  type: "transfer" | "preview", // later on, there will be more types (like "preview" on LLM)
  deviceModelId: CLSSupportedDeviceModelId,
  theme: "dark" | "light",
): FramedPictureConfig {
  return configs[type][deviceModelId][theme];
}
