import { useTheme } from "@react-navigation/native";

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
  deviceName?: string;
  lastSeenDeviceName?: string;
};

const RestoreIllustrations = ({ deviceName, lastSeenDeviceName }: Props) => {
  const isFromStax = lastSeenDeviceName?.indexOf("Stax") !== -1 && true;
  const isToStax = deviceName?.indexOf("Stax") !== -1 && true;

  const { dark } = useTheme();
  const selectedTheme = dark ? "dark" : "light";

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
