import staxTransferBackground from "./assets/transferBackground.png";
import staxPreviewBackground from "./assets/previewBackground.png";
import { FramedPictureConfig } from "./FramedPicture";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";

const staxTransferConfig: FramedPictureConfig = {
  // NB: measures in px taken directly on the .png
  frameHeight: 888,
  frameWidth: 564,
  innerHeight: 840,
  innerWidth: (840 * 400) / 670,
  innerRight: 30, // measured 32px on png and it seems to be 30px on lotties ... using 30 to avoid "long white 1px wide line"
  innerTop: 24,
  borderRightRadius: 24,
  resizeMode: "cover",
  backgroundSource: staxTransferBackground,
  leftPaddingColor: "#272727",
};

const europaTransferConfig: FramedPictureConfig = {
  // NB: measures in px taken directly on the .png
  frameHeight: 888, // TODO: TBD
  frameWidth: 564, // TODO: TBD
  innerHeight: 840, // TODO: TBD
  innerWidth: (840 * 400) / 670, // TODO: TBD
  innerRight: 30, // TODO: TBD
  innerTop: 24, // TODO: TBD
  borderRightRadius: 24, // TODO: TBD
  resizeMode: "cover", // TODO: TBD
  backgroundSource: staxTransferBackground, // TODO: replace by europaTransferBackground
  leftPaddingColor: "#272727", // TBD
};

const staxPreviewConfig: FramedPictureConfig = {
  // NB: measures in px taken directly on the .png
  frameHeight: 1283,
  frameWidth: 810,
  innerHeight: 1211,
  innerWidth: 1211 * (400 / 670),
  innerRight: 35,
  innerTop: 38,
  borderRightRadius: 57,
  backgroundSource: staxPreviewBackground,
  resizeMode: "cover",
};

const europaPreviewConfig: FramedPictureConfig = {
  // NB: measures in px taken directly on the .png
  frameHeight: 1283, // TODO: TBD
  frameWidth: 810, // TODO: TBD
  innerHeight: 1211, // TODO: TBD
  innerWidth: 1211 * (400 / 670), // TODO: TBD
  innerRight: 35, // TODO: TBD
  innerTop: 38, // TODO: TBD
  borderRightRadius: 57, // TODO: TBD
  backgroundSource: staxPreviewBackground, // TODO: replace by europaPreviewBackground
  resizeMode: "cover",
};

const configs = {
  transfer: {
    stax: staxTransferConfig,
    europa: europaTransferConfig,
  },
  preview: {
    stax: staxPreviewConfig,
    europa: europaPreviewConfig,
  },
};

export function getFramedPictureConfig(
  type: "preview" | "transfer",
  deviceModelId: CLSSupportedDeviceModelId,
): FramedPictureConfig {
  return configs[type][deviceModelId];
}
