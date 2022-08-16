import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import Config from "react-native-config";

// Any animations depending on device models but not associated to a device action
const animations: { [modelId in DeviceModelId]: any } = {
  nanoS: {},
  nanoSP: {},
  nanoX: {},
  blue: {},
  nanoFTS: {
    blePairing: {
      light: require("../../animations/nanoFTS/BlePairing/light.json"),
      dark: require("../../animations/nanoFTS/BlePairing/dark.json"),
    },
    blePaired: {
      light: require("../../animations/nanoFTS/BlePaired/light.json"),
      dark: require("../../animations/nanoFTS/BlePaired/dark.json"),
    },
  },
};

export type GetDeviceAnimationProps = {
  theme?: "light" | "dark";
  key: string;
  device: Device;
};

// Return an animation depending on a device model but not associated to a device action
export const getDeviceAnimation = ({
  theme = "light",
  key,
  device,
}: GetDeviceAnimationProps) => {
  const modelId = (Config.OVERRIDE_MODEL_ID as DeviceModelId) || device.modelId;

  if (!animations[modelId]?.[key]) {
    console.error(`No animation for ${modelId} ${key}`);
    return null;
  }

  return animations[modelId][key][theme];
}
