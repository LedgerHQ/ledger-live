import { useSelector } from "react-redux";
import { languageSelector, localeSelector, themeSelector } from "~/reducers/settings";

const useSettings = () => {
  // Language & Locale
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);

  // Theme
  const theme = useSelector(themeSelector);

  return {
    language,
    locale,

    theme,
  };
};

export default useSettings;
