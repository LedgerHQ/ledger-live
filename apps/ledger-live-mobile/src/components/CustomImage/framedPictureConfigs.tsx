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

const europaTransferConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  // NB: measures in px taken directly on the .png
  frameHeight: 888, // TODO: TBD
  frameWidth: 564, // TODO: TBD
  innerHeight: 840, // TODO: TBD
  innerWidth: (840 * 400) / 670, // TODO: TBD
  innerRight: 30, // TODO: TBD
  innerTop: 24, // TODO: TBD
  borderRightRadius: 24, // TODO: TBD
  resizeMode: "cover", // TODO: TBD
  leftPaddingColor: "#272727", // TBD
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

const europaPreviewConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  // NB: measures in px taken directly on the .png
  frameHeight: 1283, // TODO: TBD
  frameWidth: 810, // TODO: TBD
  innerHeight: 1211, // TODO: TBD
  innerWidth: 1211 * (400 / 670), // TODO: TBD
  innerRight: 35, // TODO: TBD
  innerTop: 38, // TODO: TBD
  borderRightRadius: 57, // TODO: TBD
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
