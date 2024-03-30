import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import staxTransferBackground from "./assets/transferBackground.png";
import { FramedPictureConfig } from "./FramedPicture";

export const staxTransferConfig: FramedPictureConfig = {
  frameHeight: 236,
  frameWidth: 150,
  innerHeight: 223,
  innerWidth: 140.5,
  innerRight: 8,
  innerTop: 7,
  innerLeft: 1.5,
  innerBottomHeight: 27,
  borderRightRadius: 6.5,
  backgroundSource: staxTransferBackground,
};

export const europaTransferConfig: FramedPictureConfig = {
  frameHeight: 236, // TODO:TBD
  frameWidth: 150, // TODO:TBD
  innerHeight: 223, // TODO:TBD
  innerWidth: 140.5, // TODO:TBD
  innerRight: 8, // TODO:TBD
  innerTop: 7, // TODO:TBD
  innerLeft: 1.5, // TODO:TBD
  innerBottomHeight: 27, // TODO:TBD
  borderRightRadius: 6.5, // TODO:TBD
  backgroundSource: staxTransferBackground, // TODO: replace by europaTransferBackground when it exists
};

const configs = {
  transfer: {
    stax: staxTransferConfig,
    europa: europaTransferConfig,
  },
};

export function getFramedPictureConfig(
  type: "transfer", // later on, there will be more types (like "preview" on LLM)
  deviceModelId: CLSSupportedDeviceModelId,
): FramedPictureConfig {
  return configs[type][deviceModelId];
}
