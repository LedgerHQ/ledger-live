import i18n from "i18next";
import { reactI18nextModule } from "react-i18next";
import Locale from "react-native-locale";
import locales from "./locales";

const languageDetector = {
  type: "languageDetector",
  detect: () => Locale.constants().localeIdentifier.replace("_", "-"),
  init: () => {},
  cacheUserLanguage: () => {}
};

i18n
  .use(languageDetector)
  .use(reactI18nextModule)
  .init({
    fallbackLng: "en",
    resources: locales,
    ns: ["common"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false // not needed for react as it does escape per default to prevent xss!
    }
  });

export default i18n;
