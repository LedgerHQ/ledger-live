import { useDispatch, useSelector } from "react-redux";
import { languageSelector } from "../reducers/settings";
import { useSupportedLanguages } from "./useSupportedLanguages";
import { DEFAULT_LANGUAGE } from "~/config/languages";
import { useEffect } from "react";
import { setLanguage } from "../actions/settings";

export const useEnforceSupportedLanguage = () => {
  const language = useSelector(languageSelector);
  const supportedLocales = useSupportedLanguages().locales;
  const dispatch = useDispatch();
  const currentLanguage = supportedLocales.includes(language) ? language : DEFAULT_LANGUAGE.id;

  useEffect(() => {
    if (currentLanguage !== language) {
      dispatch(setLanguage(currentLanguage));
    }
  }, [currentLanguage, dispatch, language]);

  return null;
};
