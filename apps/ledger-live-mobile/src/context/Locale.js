// @flow
import React, { useContext, useEffect, useState } from "react";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import type { TFunction } from "react-i18next";
import Locale from "react-native-locale";
import { useDispatch, useSelector } from "react-redux";
import { locales } from "../languages";
import { languageSelector } from "../reducers/settings";
import { setLanguage } from "../actions/settings";

const languageDetector = {
  type: "languageDetector",
  detect: () => {
    const { localeIdentifier, preferredLanguages } = Locale.constants();
    const locale =
      (preferredLanguages && preferredLanguages[0]) || localeIdentifier;
    const matches = locale.match(/([a-z]{2,4}[-_]([A-Z]{2,4}|[0-9]{3}))/);
    const lang = (matches && matches[1].replace("_", "-")) || "en-US";
    console.log("Language detected is " + lang); // eslint-disable-line no-console
    return lang;
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18next
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    resources: locales,
    whitelist: Object.keys(locales),
    ns: ["common"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false, // not needed for react as it does escape per default to prevent xss!
    },
  });

export { i18next as i18n };

// $FlowFixMe
const LocaleContext = React.createContext(getLocaleState(i18next));

type Props = {
  children: React$Node,
};

type LocaleState = {
  i18n: any,
  t: TFunction,
  locale: string,
};

function getLocaleState(i18n): LocaleState {
  return {
    i18n,
    t: i18n.getFixedT(),
    locale: i18n.languages[0],
  };
}

export default function LocaleProvider({ children }: Props) {
  const settingsLocale = useSelector(languageSelector);
  const dispatch = useDispatch();
  const [locale, setLocale] = useState<LocaleState>(getLocaleState(i18next));

  function updateLocale() {
    const language = getLocaleState(i18next);
    dispatch(setLanguage(language.locale));
    setLocale(language);
  }

  useEffect(() => {
    i18next.on("languageChanged", updateLocale);
    if (settingsLocale) i18next.changeLanguage(settingsLocale);

    return () => {
      i18next.off("languageChanged", updateLocale);
    };
  }, []);

  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
