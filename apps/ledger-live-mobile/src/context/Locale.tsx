import React, {
  useMemo,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import type { TFunction } from "react-i18next";
import { getTimeZone } from "react-native-localize";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import {
  DEFAULT_LANGUAGE_LOCALE,
  getDefaultLanguageLocale,
  locales,
} from "../languages";
import { languageSelector } from "../reducers/settings";

try {
  if ("__setDefaultTimeZone" in Intl.DateTimeFormat) {
    /** https://formatjs.io/docs/polyfills/intl-datetimeformat/#default-timezone */
    // $FlowFixMe
    Intl.DateTimeFormat.__setDefaultTimeZone(getTimeZone()); // eslint-disable-line no-underscore-dangle
  }
} catch (error) {
  // eslint-disable-next-line no-console
  console.log(error);
}

i18next.use(initReactI18next).init({
  fallbackLng: DEFAULT_LANGUAGE_LOCALE,
  resources: locales,
  whitelist: Object.keys(locales),
  ns: ["common"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false, // not needed for react as it does escape per default to prevent xss!
  },
});
export { i18next as i18n };
type Props = {
  children: React.ReactNode;
};
export type SupportedLanguages = "fr" | "en" | "es" | "zh" | "ru" | "pt";

type LocaleState = {
  i18n: any;
  t: TFunction;
  locale: SupportedLanguages;
};

function getLocaleState(i18n): LocaleState {
  return {
    i18n,
    t: i18n.getFixedT(),
    locale: getDefaultLanguageLocale(),
  };
}

// @ts-expect-error TODO explain why
const LocaleContext = React.createContext(getLocaleState(i18next));
export default function LocaleProvider({ children }: Props) {
  const language = useSelector(languageSelector);
  useEffect(() => {
    i18next.changeLanguage(language);
  }, [language]);
  const value: LocaleState = useMemo(
    () => ({
      i18n: i18next,
      t: i18next.getFixedT(),
      locale: language,
    }),
    [language],
  );
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}
export function useLocale() {
  return useContext(LocaleContext);
}
const lastAskedLanguageAvailable = "2022-09-23";
// To reset os language proposition, change this date !
export async function hasAnsweredLanguageAvailable() {
  const memory = await AsyncStorage.getItem("hasAnsweredLanguageAvailable");
  return memory === lastAskedLanguageAvailable;
}
export async function answerLanguageAvailable() {
  return AsyncStorage.setItem(
    "hasAnsweredLanguageAvailable",
    lastAskedLanguageAvailable,
  );
}
export const useLanguageAvailableChecked = () => {
  const [checked, setChecked] = useState(true);
  const accept = useCallback(() => {
    answerLanguageAvailable().then(() => {
      setChecked(true);
    });
  }, []);
  useEffect(() => {
    hasAnsweredLanguageAvailable().then(setChecked);
  }, []);
  return [checked, accept];
};
