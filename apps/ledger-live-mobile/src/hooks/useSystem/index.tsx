import { useWindowDimensions, Platform } from "react-native";
import { useSelector } from "react-redux";
import { languageSelector, localeSelector, themeSelector } from "~/reducers/settings";

const useSystem = () => {
  // Device dimensions
  const { width, height } = useWindowDimensions();

  // Device informations
  const os = Platform.OS;
  const version = Platform.Version;

  // Language informations
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);

  // Styles
  const theme = useSelector(themeSelector);

  return {
    platform: { os, version },
    screen: { width, height },
    i18: { language, locale },
    styles: { theme },
  };
};

export default useSystem;
