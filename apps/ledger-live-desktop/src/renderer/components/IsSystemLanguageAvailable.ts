import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { languageSelector, getInitialLanguageAndLocale } from "~/renderer/reducers/settings";
import { pushedLanguages } from "~/config/languages";
import { useSupportedLanguages } from "../hooks/useSupportedLanguages";

// To reset os language proposition, change this date !
const lastAskedLanguageAvailable = "2022-09-23";
export function hasAnsweredLanguageAvailable() {
  return global.localStorage.getItem("hasAnsweredLanguageAvailable") === lastAskedLanguageAvailable;
}
export function answerLanguageAvailable() {
  return global.localStorage.setItem("hasAnsweredLanguageAvailable", lastAskedLanguageAvailable);
}
const IsSystemLanguageAvailable = () => {
  const dispatch = useDispatch();
  const currentLanguage = useSelector(languageSelector);
  const { language: defaultLanguage } = getInitialLanguageAndLocale();
  const supportedLocales = useSupportedLanguages(pushedLanguages).locales;

  useEffect(() => {
    if (
      !hasAnsweredLanguageAvailable() &&
      currentLanguage !== defaultLanguage &&
      // TODO casting as string[] because of https://stackoverflow.com/questions/56565528/typescript-const-assertions-how-to-use-array-prototype-includes
      (supportedLocales as string[]).includes(defaultLanguage)
    ) {
      dispatch(
        openModal("MODAL_SYSTEM_LANGUAGE_AVAILABLE", {
          osLanguage: defaultLanguage,
          currentLanguage,
        }),
      );
    }
  }, [defaultLanguage, dispatch, currentLanguage, supportedLocales]);
  return null;
};
export default IsSystemLanguageAvailable;
