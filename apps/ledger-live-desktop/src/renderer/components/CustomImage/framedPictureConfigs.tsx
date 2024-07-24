import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import staxTransferBackgroundLight from "./assets/staxTransferBackgroundLight.png";
import staxTransferBackgroundDark from "./assets/staxTransferBackgroundDark.png";
import europaTransferBackgroundLight from "./assets/europaTransferBackgroundLight.png";
import europaTransferBackgroundDark from "./assets/europaTransferBackgroundDark.png";
import { FramedPictureConfig } from "./FramedPicture";

export const staxTransferConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  frameHeight: 236,
  frameWidth: 150,
  innerHeight: 223,
  innerWidth: 140.5,
  innerRight: 8,
  innerTop: 7,
  innerLeft: 1.5,
  innerBottomHeight: 27,
  borderRightRadius: 6.5,
};

export const europaTransferConfig: Omit<FramedPictureConfig, "backgroundSource"> = {
  frameHeight: 236, // TODO:TBD
  frameWidth: 150, // TODO:TBD
  innerHeight: 223, // TODO:TBD
  innerWidth: 140.5, // TODO:TBD
  innerRight: 8, // TODO:TBD
  innerTop: 7, // TODO:TBD
  innerLeft: 1.5, // TODO:TBD
  innerBottomHeight: 27, // TODO:TBD
  borderRightRadius: 6.5, // TODO:TBD
};

type FrameConfigMap = {
  [key in "transfer" | "preview"]: {
    [modelId in CLSSupportedDeviceModelId]: {
      light: FramedPictureConfig;
      dark: FramedPictureConfig;
    };
  };
};

const configs: FrameConfigMap = {
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
        ...europaTransferConfig,
        backgroundSource: europaTransferBackgroundLight,
      },
      dark: {
        ...europaTransferConfig,
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
