import { DeviceModelId } from "@ledgerhq/types-devices";
import { useTheme } from "styled-components/native";

import NanoToNanoDark from "./assets/dark/NanoToNano";
import NanoToStaxDark from "./assets/dark/NanoToStax";
import StaxToNanoDark from "./assets/dark/StaxToNano";
import StaxToStaxDark from "./assets/dark/StaxToStax";

import NanoToNanoLight from "./assets/light/NanoToNano";
import NanoToStaxLight from "./assets/light/NanoToStax";
import StaxToNanoLight from "./assets/light/StaxToNano";
import StaxToStaxLight from "./assets/light/StaxToStax";

const restoreIllustrations = {
  nanoToNano: {
    dark: NanoToNanoDark,
    light: NanoToNanoLight,
  },
  nanoToStax: {
    dark: NanoToStaxDark,
    light: NanoToStaxLight,
  },
  staxToNano: {
    dark: StaxToNanoDark,
    light: StaxToNanoLight,
  },
  staxToStax: {
    dark: StaxToStaxDark,
    light: StaxToStaxLight,
  },
};

type Props = {
  deviceModelId?: DeviceModelId;
  lastSeenDeviceModelId?: DeviceModelId;
};

const RestoreIllustrations = ({ deviceModelId, lastSeenDeviceModelId }: Props) => {
  const isFromStax = lastSeenDeviceModelId === DeviceModelId.stax;
  const isToStax = deviceModelId === DeviceModelId.stax;

  const { palette } = useTheme();
  const selectedTheme = palette === "dark" ? "dark" : "light";

  if (isFromStax) {
    if (isToStax) {
      return restoreIllustrations.staxToStax[selectedTheme];
    }
    return restoreIllustrations.staxToNano[selectedTheme];
  }
  if (!isFromStax && !isToStax) {
    return restoreIllustrations.nanoToNano[selectedTheme];
  }
  return restoreIllustrations.nanoToStax[selectedTheme];
};

export default RestoreIllustrations;
