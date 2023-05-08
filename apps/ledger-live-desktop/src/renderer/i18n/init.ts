import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import locales from ".";
const config = {
  resources: locales,
  lng: "en",
  defaultNS: "app",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  debug: __DEV__,
  react: {
    useSuspense: false,
  },
};
i18n.use(initReactI18next).init(config);
export default i18n;
