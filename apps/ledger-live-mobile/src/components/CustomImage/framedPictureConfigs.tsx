import staxTransferBackground from "./assets/staxTransferBackground.png";
import staxPreviewBackground from "./assets/staxPreviewBackground.png";
import europaBackgroundLight from "./assets/europaBackgroundLight.png";
import europaBackgroundDark from "./assets/europaBackgroundDark.png";
import { FramedPictureConfig } from "./FramedPicture";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";

const staxTransferConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  // NB: measures in px taken directly on the .png
  frameHeight: 888,
  frameWidth: 564,
  innerHeight: 840,
  innerWidth: (840 * 400) / 670,
  innerRight: 30, // measured 32px on png and it seems to be 30px on lotties ... using 30 to avoid "long white 1px wide line"
  innerTop: 24,
  borderRightRadius: 24,
  resizeMode: "cover",
  leftPaddingColor: "#272727",
};

const staxPreviewConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  // NB: measures in px taken directly on the .png
  frameHeight: 1283,
  frameWidth: 810,
  innerHeight: 1211,
  innerWidth: 1211 * (400 / 670),
  innerRight: 35,
  innerTop: 38,
  borderRightRadius: 57,
  resizeMode: "cover",
};

const EUROPA_FRAME_WIDTH = 572;
const EUROPA_FRAME_HEIGHT = 784;

const europaTransferConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  frameWidth: EUROPA_FRAME_WIDTH,
  frameHeight: EUROPA_FRAME_HEIGHT,
  innerWidth: 448,
  innerHeight: 575,
  innerRight: 65,
  innerTop: 60,
  borderRightRadius: 4,
  borderLeftRadius: 4,
  resizeMode: "cover",
};

const europaPreviewConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  frameWidth: EUROPA_FRAME_WIDTH,
  frameHeight: EUROPA_FRAME_HEIGHT,
  innerWidth: 448,
  innerHeight: 575,
  innerRight: 65,
  innerTop: 60,
  borderRightRadius: 4,
  borderLeftRadius: 4,
  resizeMode: "cover",
};

const configs = {
  transfer: {
    stax: {
      light: {
        ...staxTransferConfig,
        backgroundSource: staxTransferBackground,
      },
      dark: {
        ...staxTransferConfig,
        backgroundSource: staxTransferBackground,
      },
    },
    europa: {
      light: {
        ...europaTransferConfig,
        backgroundSource: europaBackgroundLight,
      },
      dark: {
        ...europaTransferConfig,
        backgroundSource: europaBackgroundDark,
      },
    },
  },
  preview: {
    stax: {
      light: {
        ...staxPreviewConfig,
        backgroundSource: staxPreviewBackground,
      },
      dark: {
        ...staxPreviewConfig,
        backgroundSource: staxPreviewBackground,
      },
    },
    europa: {
      light: {
        ...europaPreviewConfig,
        backgroundSource: europaBackgroundLight,
      },
      dark: {
        ...europaPreviewConfig,
        backgroundSource: europaBackgroundDark,
      },
    },
  },
};

export function getFramedPictureConfig(
  type: "preview" | "transfer",
  deviceModelId: CLSSupportedDeviceModelId,
  theme: "light" | "dark",
): FramedPictureConfig {
  return configs[type][deviceModelId][theme];
}
