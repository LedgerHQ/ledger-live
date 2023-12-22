import { useSelector } from "react-redux";
import { languageSelector, localeSelector } from "~/reducers/settings";

const useSettings = () => {
  // Language & Locale
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);

  return {
    language,
    locale,
  };
};

export default useSettings;
