import i18n, { InitOptions } from "i18next";
import { initReactI18next } from "react-i18next";
import locales, { i18_DEFAULT_NAMESPACE } from ".";
import { DEFAULT_LANGUAGE } from "~/config/languages";
import { ICU, icuI18nFormat } from "./icu";

const config: InitOptions = {
  resources: locales,
  lng: DEFAULT_LANGUAGE.id,
  defaultNS: i18_DEFAULT_NAMESPACE,
  fallbackLng: DEFAULT_LANGUAGE.id,
  i18nFormat: icuI18nFormat,
  interpolation: {
    escapeValue: false,
  },
  debug: __DEV__,
  react: {
    useSuspense: false,
  },
};

i18n.use(ICU).use(initReactI18next).init(config);

export default i18n;
