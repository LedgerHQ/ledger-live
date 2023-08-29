import { LanguageMap } from "~/config/languages";

import de from "../../../static/i18n/de/app.json";
import en from "../../../static/i18n/en/app.json";
import es from "../../../static/i18n/es/app.json";
import fr from "../../../static/i18n/fr/app.json";
import ja from "../../../static/i18n/ja/app.json";
import ko from "../../../static/i18n/ko/app.json";
import pt from "../../../static/i18n/pt-BR/app.json";
import ru from "../../../static/i18n/ru/app.json";
import tr from "../../../static/i18n/tr/app.json";
import zh from "../../../static/i18n/zh/app.json";

export const i18_DEFAULT_NAMESPACE = "app";

const LanguageToAppLanguageFile: LanguageMap<Object> = {
  de,
  en,
  es,
  fr,
  ja,
  ko,
  pt,
  ru,
  tr,
  zh,
};

export default Object.entries(LanguageToAppLanguageFile).reduce((acc, [lang, translation]) => {
  return { ...acc, [lang]: { [i18_DEFAULT_NAMESPACE]: translation } };
}, {});

/*
  The following is the better way to import languages but it is only supported by Esbuild.
  Webpack has another way using require.context which is also proprietary syntax.
  Since both tools are not compatible, I'm commenting for the moment and we will need reevaluate in the future.
*/

// import * as translationsImports from "../../../static/i18n/**/*.json";
/*
const { default: translationsArray, filenames } = translationsImports;

const regexp = /\.\/static\/i18n\/([a-z]{2})\/(.+).json$/;

const translations = filenames.reduce((acc, filename, index) => {
  const lang = filename.match(regexp);
  return {
    ...acc,
    [lang[1]]: {
      [lang[2]]: translationsArray[index],
    },
  };
}, {});
export default translations;
*/
