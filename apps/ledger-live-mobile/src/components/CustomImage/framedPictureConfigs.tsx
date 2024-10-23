import staxPreviewBackground from "./assets/staxPreviewBackground.png";
import staxBackgroundLight from "./assets/staxBackgroundLight.png";
import staxBackgroundDark from "./assets/staxBackgroundDark.png";
import europaBackgroundLight from "./assets/europaBackgroundLight.png";
import europaBackgroundDark from "./assets/europaBackgroundDark.png";
import { FramedPictureConfig } from "./FramedPicture";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";

const staxTransferConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  // NB: measures in px taken directly on the .png
  frameHeight: 960,
  frameWidth: 960,
  innerHeight: 765,
  innerWidth: 483,
  innerRight: 239,
  innerTop: 89,
  borderRightRadius: 36,
  resizeMode: "cover",
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

const europaTransferConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  frameWidth: 960,
  frameHeight: 960,
  innerWidth: 440,
  innerHeight: 557,
  innerRight: 252,
  innerTop: 147,
  borderRightRadius: 6,
  borderLeftRadius: 6,
  resizeMode: "cover",
};

const europaPreviewConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  ...europaTransferConfig,
  scale: 0.4,
};

const configs = {
  transfer: {
    stax: {
      light: {
        ...staxTransferConfig,
        backgroundSource: staxBackgroundLight,
      },
      dark: {
        ...staxTransferConfig,
        backgroundSource: staxBackgroundDark,
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
