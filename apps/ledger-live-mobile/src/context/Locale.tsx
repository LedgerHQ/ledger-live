import React, { useMemo, useContext, useCallback, useEffect, useState } from "react";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import type { TFunction } from "react-i18next";
import { getTimeZone } from "react-native-localize";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";
import RNRestart from "react-native-restart";

import { DEFAULT_LANGUAGE_LOCALE, getDefaultLanguageLocale, locales } from "../languages";
import { setLanguage } from "~/actions/settings";
import { useDispatch } from "react-redux";
import { useSettings } from "~/hooks";

try {
  if ("__setDefaultTimeZone" in Intl.DateTimeFormat) {
    /** https://formatjs.io/docs/polyfills/intl-datetimeformat/#default-timezone */
    // eslint-disable-next-line no-underscore-dangle
    (
      Intl.DateTimeFormat as typeof Intl.DateTimeFormat & {
        __setDefaultTimeZone(_: string): void;
      }
    ).__setDefaultTimeZone(getTimeZone());
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

const SUPPORTED_LANGUAGES = ["en", "fr", "es", "ru", "zh", "de", "tr", "ja", "ko", "pt"] as const;

export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];

type LocaleState = {
  i18n: typeof i18next;
  t: TFunction;
  locale: SupportedLanguages;
};

function getLocaleState(i18n: typeof i18next): LocaleState {
  return {
    i18n,
    t: i18n.getFixedT(DEFAULT_LANGUAGE_LOCALE),
    locale: getDefaultLanguageLocale() as SupportedLanguages,
  };
}

const LocaleContext = React.createContext(getLocaleState(i18next));
export default function LocaleProvider({ children }: Props) {
  const { language } = useSettings();
  const dispatch = useDispatch();
  const currentLanguage = SUPPORTED_LANGUAGES.includes(language as SupportedLanguages)
    ? language
    : DEFAULT_LANGUAGE_LOCALE;

  useEffect(() => {
    if (currentLanguage !== language) {
      dispatch(setLanguage(currentLanguage));
    }
  }, [currentLanguage, dispatch, language]);

  useEffect(() => {
    i18next.changeLanguage(currentLanguage);
  }, [currentLanguage]);

  // Force LTR if user has previously set Arabic language.
  // To be removed the day we want to support arabic again.
  if (I18nManager.isRTL) {
    I18nManager.forceRTL(false);
    RNRestart.Restart();
  }

  const value: LocaleState = useMemo(
    () => ({
      i18n: i18next,
      t: i18next.getFixedT(DEFAULT_LANGUAGE_LOCALE),
      locale: currentLanguage as SupportedLanguages,
    }),
    [currentLanguage],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
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
  return AsyncStorage.setItem("hasAnsweredLanguageAvailable", lastAskedLanguageAvailable);
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
